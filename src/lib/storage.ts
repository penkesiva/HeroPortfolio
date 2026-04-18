/**
 * Helpers for Supabase Storage bucket operations.
 * Both buckets are PRIVATE — images are served via signed URLs.
 *
 * Buckets must be created in the Supabase dashboard (public: false):
 *   - event-images
 *   - profile-photos
 *
 * Storage RLS policies are defined in supabase/migrations/001_initial_schema.sql
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_EVENT_IMAGES = "event-images";
export const BUCKET_PROFILE_PHOTOS = "profile-photos";

/** Signed URL TTL in seconds — 1 year. Long enough for portfolios shared via links. */
const SIGNED_URL_TTL = 60 * 60 * 24 * 365;

/**
 * Upload an event image to private storage.
 * Returns a signed URL for the uploaded file.
 */
export async function uploadEventImage(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
  file: File,
  position: number,
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${eventId}/${Date.now()}-${position}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_EVENT_IMAGES)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) return { url: null, path: null, error: uploadError.message };

  const { data, error: signError } = await supabase.storage
    .from(BUCKET_EVENT_IMAGES)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (signError || !data?.signedUrl) {
    return { url: null, path, error: signError?.message ?? "Could not sign URL" };
  }

  return { url: data.signedUrl, path, error: null };
}

export async function uploadProfilePhoto(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/profile.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_PROFILE_PHOTOS)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { url: null, path: null, error: uploadError.message };

  const { data, error: signError } = await supabase.storage
    .from(BUCKET_PROFILE_PHOTOS)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (signError || !data?.signedUrl) {
    return { url: null, path, error: signError?.message ?? "Could not sign URL" };
  }

  return { url: data.signedUrl, path, error: null };
}

/**
 * Generate a signed URL for an existing storage path.
 * Returns the original path as fallback if signing fails
 * (e.g. when the path is already an https:// URL or a data: URI).
 */
export async function signStoragePath(
  supabase: SupabaseClient,
  bucket: string,
  storagePath: string,
): Promise<string> {
  // Pass through: empty, external URLs, data URIs, and local public-folder paths
  if (
    !storagePath ||
    storagePath.startsWith("http") ||
    storagePath.startsWith("data:") ||
    storagePath.startsWith("/")
  ) {
    return storagePath;
  }
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  return data?.signedUrl ?? storagePath;
}

/**
 * Batch-sign an array of storage paths from the event-images bucket.
 * Returns a map of path → signedUrl.
 */
export async function signEventImagePaths(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (paths.length === 0) return result;

  // Filter out already-resolved URLs (data: URIs or https:// links)
  const needSigning = paths.filter(
    (p) => p && !p.startsWith("http") && !p.startsWith("data:"),
  );
  const alreadyResolved = paths.filter(
    (p) => p && (p.startsWith("http") || p.startsWith("data:")),
  );

  // Pass through resolved URLs unchanged
  for (const p of alreadyResolved) result.set(p, p);

  if (needSigning.length === 0) return result;

  const { data } = await supabase.storage
    .from(BUCKET_EVENT_IMAGES)
    .createSignedUrls(needSigning, SIGNED_URL_TTL);

  for (const item of data ?? []) {
    // Supabase types both path and signedUrl as string | null — guard both
    const key = item.path ?? "";
    if (!key) continue;
    result.set(key, (item.signedUrl ?? key) as string);
  }

  return result;
}

export async function deleteEventImage(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<void> {
  if (!storagePath || storagePath.startsWith("http") || storagePath.startsWith("data:")) return;
  await supabase.storage.from(BUCKET_EVENT_IMAGES).remove([storagePath]);
}

/** Save image record to DB after uploading to storage */
export async function saveEventImageRecord(
  supabase: SupabaseClient,
  eventId: string,
  userId: string,
  storagePath: string,
  position: number,
  caption?: string,
): Promise<void> {
  await supabase.from("event_images").insert({
    event_id: eventId,
    user_id: userId,
    storage_path: storagePath,
    position,
    caption: caption ?? null,
  });
}

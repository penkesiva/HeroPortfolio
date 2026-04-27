import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AlbumGrid } from "@/components/AlbumGrid";
import { BackToTimeline } from "@/components/BackToTimeline";
import { displayNameFromUser } from "@/lib/auth/displayName";
import {
  dbProfileToSiteIntro,
  getProfile,
  getUserPlan,
  getUserTimeline,
} from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your album",
  description: "All your achievement photos in one place.",
};

export default async function AlbumPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline/album");

  const name = displayNameFromUser(user);
  const [profile, timeline, plan] = await Promise.all([
    getProfile(supabase, user.id),
    getUserTimeline(supabase, user.id),
    getUserPlan(supabase, user.id),
  ]);
  const siteIntro = await dbProfileToSiteIntro(supabase, profile, name);

  // Collect all images with their event context
  type AlbumPhoto = {
    src: string;
    eventTitle: string;
    year: number;
    categories: string[];
  };

  const photos: AlbumPhoto[] = [];
  for (const block of timeline) {
    for (const achievement of block.achievements) {
      const imgs =
        achievement.images && achievement.images.length > 0
          ? achievement.images
          : achievement.imageSrc
            ? [achievement.imageSrc]
            : [];
      for (const src of imgs) {
        photos.push({
          src,
          eventTitle: achievement.title,
          year: block.year,
          categories: achievement.categories ?? [],
        });
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        userId={user.id}
        displayName={name}
        plan={plan}
        avatarSrc={siteIntro.photoSrc}
        avatarAlt={siteIntro.photoAlt ?? siteIntro.name}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-2">
          <BackToTimeline />
        </div>
        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
            My Album
          </h1>
          <p className="mt-2 text-sm text-parchment-muted">
            {photos.length === 0
              ? "No photos yet. Add images to your events to see them here."
              : `${photos.length} photo${photos.length === 1 ? "" : "s"} across all your achievements`}
          </p>
        </div>

        <AlbumGrid photos={photos} />
      </main>
    </div>
  );
}

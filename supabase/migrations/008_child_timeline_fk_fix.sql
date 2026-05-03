-- year_blocks, events, event_images use user_id as a generic portfolio-owner
-- UUID that can belong to either auth.users (via profiles) OR child_profiles.
-- Drop the FK constraints that restrict user_id to profiles only.
-- Ownership integrity is enforced by RLS policies; cascade deletes are
-- handled by the trigger below.

-- ─── Drop FK constraints ──────────────────────────────────────────────────────

ALTER TABLE public.year_blocks
  DROP CONSTRAINT IF EXISTS year_blocks_user_id_fkey;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_user_id_fkey;

ALTER TABLE public.event_images
  DROP CONSTRAINT IF EXISTS event_images_user_id_fkey;

-- ─── Cascade delete child data when a child_profile is deleted ────────────────

CREATE OR REPLACE FUNCTION public.cascade_delete_child_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- event_images → events → year_blocks cascade via their own FKs,
  -- so deleting year_blocks is sufficient.
  DELETE FROM public.year_blocks WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_child_profile_deleted ON public.child_profiles;

CREATE TRIGGER on_child_profile_deleted
  BEFORE DELETE ON public.child_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.cascade_delete_child_timeline();

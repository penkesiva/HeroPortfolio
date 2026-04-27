-- event_images was only selectable by the row owner, so getUserTimeline() on
-- the public /p/[userId] page (anon Supabase session) returned zero image rows.
-- Events and year_blocks already allow public SELECT; images must too so the
-- server can read storage_path and issue signed URLs. Files stay private in Storage.

drop policy if exists "Public event_images readable" on public.event_images;

create policy "Public event_images readable"
  on public.event_images for select
  using (true);

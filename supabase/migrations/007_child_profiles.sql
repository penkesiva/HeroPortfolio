-- Guardian/parent child profile support
-- Each child profile is managed by a parent (auth.users row).
-- The child's UUID is reused as user_id in year_blocks/events, so all
-- existing timeline infrastructure works without schema changes.

-- ─── child_profiles ──────────────────────────────────────────────────────────

create table if not exists public.child_profiles (
  id             uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.profiles(id) on delete cascade,
  display_name   text not null,
  grade          int,
  birth_year     int,
  photo_url      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.child_profiles enable row level security;

drop policy if exists "Parents can manage own child profiles" on public.child_profiles;
drop policy if exists "Public child profiles readable"       on public.child_profiles;

create policy "Parents can manage own child profiles"
  on public.child_profiles for all
  using  (auth.uid() = parent_user_id)
  with check (auth.uid() = parent_user_id);

-- Public portfolios: anyone can read a child profile by id
create policy "Public child profiles readable"
  on public.child_profiles for select
  using (true);

create trigger child_profiles_updated_at before update on public.child_profiles
  for each row execute procedure public.set_updated_at();

-- ─── Extend year_blocks RLS to allow parents ────────────────────────────────

drop policy if exists "Users can manage own year_blocks" on public.year_blocks;

create policy "Users can manage own year_blocks"
  on public.year_blocks for all
  using (
    auth.uid() = user_id
    OR user_id IN (
      SELECT id FROM public.child_profiles WHERE parent_user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    OR user_id IN (
      SELECT id FROM public.child_profiles WHERE parent_user_id = auth.uid()
    )
  );

-- ─── Extend events RLS to allow parents ──────────────────────────────────────

drop policy if exists "Users can manage own events" on public.events;

create policy "Users can manage own events"
  on public.events for all
  using (
    auth.uid() = user_id
    OR user_id IN (
      SELECT id FROM public.child_profiles WHERE parent_user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    OR user_id IN (
      SELECT id FROM public.child_profiles WHERE parent_user_id = auth.uid()
    )
  );

-- ─── Extend event_images RLS to allow parents ────────────────────────────────

drop policy if exists "Users can manage own event_images" on public.event_images;

create policy "Users can manage own event_images"
  on public.event_images for all
  using (
    auth.uid() = user_id
    OR user_id IN (
      SELECT id FROM public.child_profiles WHERE parent_user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    OR user_id IN (
      SELECT id FROM public.child_profiles WHERE parent_user_id = auth.uid()
    )
  );

-- ─── Storage: allow parents to manage child images ───────────────────────────
-- Storage paths are prefixed with user_id (child's UUID) so parents need
-- access to folders they don't own in auth terms.

drop policy if exists "Owners can read own event images"   on storage.objects;
drop policy if exists "Owners can upload event images"     on storage.objects;
drop policy if exists "Owners can delete own event images" on storage.objects;

create policy "Owners can read own event images"
  on storage.objects for select
  using (
    bucket_id = 'event-images'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.child_profiles WHERE parent_user_id = auth.uid()
      )
    )
  );

create policy "Owners can upload event images"
  on storage.objects for insert
  with check (
    bucket_id = 'event-images'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.child_profiles WHERE parent_user_id = auth.uid()
      )
    )
  );

create policy "Owners can delete own event images"
  on storage.objects for delete
  using (
    bucket_id = 'event-images'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.child_profiles WHERE parent_user_id = auth.uid()
      )
    )
  );

drop policy if exists "Owners can read own profile photo"   on storage.objects;
drop policy if exists "Owners can upload profile photo"     on storage.objects;
drop policy if exists "Owners can update profile photo"     on storage.objects;
drop policy if exists "Owners can delete own profile photo" on storage.objects;

create policy "Owners can read own profile photo"
  on storage.objects for select
  using (
    bucket_id = 'profile-photos'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.child_profiles WHERE parent_user_id = auth.uid()
      )
    )
  );

create policy "Owners can upload profile photo"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.child_profiles WHERE parent_user_id = auth.uid()
      )
    )
  );

create policy "Owners can update profile photo"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.child_profiles WHERE parent_user_id = auth.uid()
      )
    )
  );

create policy "Owners can delete own profile photo"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.child_profiles WHERE parent_user_id = auth.uid()
      )
    )
  );

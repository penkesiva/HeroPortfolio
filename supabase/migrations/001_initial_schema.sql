-- HeroPortfolio initial schema
-- Idempotent: safe to re-run. All policies are dropped and recreated.
-- Run this in the Supabase SQL editor or via `supabase db push`

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  display_name          text,
  hero_lead             text,
  role                  text,
  bio                   text,
  photo_url             text,
  plan                  text not null default 'free' check (plan in ('free','pro')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  -- AI summarizer usage counter (resets monthly via cron or on read)
  ai_uses_this_month    int not null default 0,
  ai_uses_reset_at      timestamptz not null default date_trunc('month', now()),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile"    on public.profiles;
drop policy if exists "Users can insert own profile"  on public.profiles;
drop policy if exists "Users can update own profile"  on public.profiles;
drop policy if exists "Public profiles are readable"  on public.profiles;

-- Authenticated users manage their own row
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Public profiles readable by anyone (for /p/[userId])
create policy "Public profiles are readable"
  on public.profiles for select
  using (true);

-- ─── year_blocks ─────────────────────────────────────────────────────────────
create table if not exists public.year_blocks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  year       int not null,
  tagline    text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, year)
);

alter table public.year_blocks enable row level security;

drop policy if exists "Users can manage own year_blocks" on public.year_blocks;
drop policy if exists "Public year_blocks readable"      on public.year_blocks;

create policy "Users can manage own year_blocks"
  on public.year_blocks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public year_blocks readable"
  on public.year_blocks for select
  using (true);

-- ─── events ──────────────────────────────────────────────────────────────────
create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  year_block_id  uuid not null references public.year_blocks(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  heading1       text not null default '',
  heading2       text,
  heading3       text,
  body           text,
  categories     text[] not null default '{}',
  video_url      text,
  music_url      text,
  links          jsonb not null default '[]',
  position       int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "Users can manage own events" on public.events;
drop policy if exists "Public events readable"      on public.events;

create policy "Users can manage own events"
  on public.events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public events readable"
  on public.events for select
  using (true);

create index if not exists events_user_year on public.events(user_id, year_block_id);

-- ─── event_images ─────────────────────────────────────────────────────────────
create table if not exists public.event_images (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  caption      text,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.event_images enable row level security;

drop policy if exists "Users can manage own event_images" on public.event_images;
drop policy if exists "Public event_images readable"      on public.event_images;

create policy "Users can manage own event_images"
  on public.event_images for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- event_images rows are NOT publicly readable — images are served via signed URLs
-- (no "Public event_images readable" policy needed)

create index if not exists event_images_event_id on public.event_images(event_id);

-- ─── profile_views ────────────────────────────────────────────────────────────
create table if not exists public.profile_views (
  id                  uuid primary key default gen_random_uuid(),
  portfolio_user_id   uuid not null references public.profiles(id) on delete cascade,
  viewer_ip_hash      text not null,
  referrer            text,
  viewed_at           timestamptz not null default now()
);

alter table public.profile_views enable row level security;

drop policy if exists "Anyone can log a profile view" on public.profile_views;
drop policy if exists "Owner can read own views"      on public.profile_views;

-- Anyone can insert a view (anonymous tracking)
create policy "Anyone can log a profile view"
  on public.profile_views for insert
  with check (true);

-- Only the portfolio owner can read their own view stats
create policy "Owner can read own views"
  on public.profile_views for select
  using (auth.uid() = portfolio_user_id);

create index if not exists profile_views_user_id on public.profile_views(portfolio_user_id, viewed_at desc);

-- ─── auto-create profile on signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── updated_at triggers ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at   on public.profiles;
drop trigger if exists year_blocks_updated_at on public.year_blocks;
drop trigger if exists events_updated_at      on public.events;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger year_blocks_updated_at before update on public.year_blocks
  for each row execute procedure public.set_updated_at();

create trigger events_updated_at before update on public.events
  for each row execute procedure public.set_updated_at();

-- ─── Storage buckets (private — images served via signed URLs) ───────────────
insert into storage.buckets (id, name, public)
  values ('event-images', 'event-images', false)
  on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
  values ('profile-photos', 'profile-photos', false)
  on conflict (id) do update set public = false;

-- ─── Storage policies — event-images ─────────────────────────────────────────
drop policy if exists "Owners can read own event images"   on storage.objects;
drop policy if exists "Owners can upload event images"     on storage.objects;
drop policy if exists "Owners can delete own event images" on storage.objects;
drop policy if exists "Anyone can view event images"       on storage.objects;
drop policy if exists "Auth users can upload event images" on storage.objects;

create policy "Owners can read own event images"
  on storage.objects for select
  using (
    bucket_id = 'event-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owners can upload event images"
  on storage.objects for insert
  with check (
    bucket_id = 'event-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owners can delete own event images"
  on storage.objects for delete
  using (
    bucket_id = 'event-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── Storage policies — profile-photos ───────────────────────────────────────
drop policy if exists "Owners can read own profile photo"   on storage.objects;
drop policy if exists "Owners can upload profile photo"     on storage.objects;
drop policy if exists "Owners can update profile photo"     on storage.objects;
drop policy if exists "Owners can delete own profile photo" on storage.objects;

create policy "Owners can read own profile photo"
  on storage.objects for select
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owners can upload profile photo"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owners can update profile photo"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owners can delete own profile photo"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

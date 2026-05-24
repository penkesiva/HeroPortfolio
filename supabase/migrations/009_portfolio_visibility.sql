-- Per-portfolio public/private visibility (default: private)

alter table public.profiles
  add column if not exists is_public boolean not null default false;

alter table public.child_profiles
  add column if not exists is_public boolean not null default false;

-- ─── profiles: only expose public rows to anonymous visitors ─────────────────

drop policy if exists "Public profiles are readable" on public.profiles;

create policy "Public profiles are readable"
  on public.profiles for select
  using (is_public = true);

-- ─── child_profiles ──────────────────────────────────────────────────────────

drop policy if exists "Public child profiles readable" on public.child_profiles;

create policy "Public child profiles readable"
  on public.child_profiles for select
  using (is_public = true);

-- ─── timeline data: readable only when the portfolio owner is public ─────────

drop policy if exists "Public year_blocks readable" on public.year_blocks;

create policy "Public year_blocks readable"
  on public.year_blocks for select
  using (
    user_id in (select id from public.profiles where is_public = true)
    or user_id in (select id from public.child_profiles where is_public = true)
  );

drop policy if exists "Public events readable" on public.events;

create policy "Public events readable"
  on public.events for select
  using (
    user_id in (select id from public.profiles where is_public = true)
    or user_id in (select id from public.child_profiles where is_public = true)
  );

drop policy if exists "Public event_images readable" on public.event_images;

create policy "Public event_images readable"
  on public.event_images for select
  using (
    user_id in (select id from public.profiles where is_public = true)
    or user_id in (select id from public.child_profiles where is_public = true)
  );

-- Resolve visibility without leaking private portfolio content to anon callers.
create or replace function public.get_portfolio_visibility(p_portfolio_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.profiles where id = p_portfolio_id) then
      (select case when is_public then 'public' else 'private' end
         from public.profiles where id = p_portfolio_id)
    when exists (select 1 from public.child_profiles where id = p_portfolio_id) then
      (select case when is_public then 'public' else 'private' end
         from public.child_profiles where id = p_portfolio_id)
    else 'not_found'
  end;
$$;

revoke all on function public.get_portfolio_visibility(uuid) from public;
grant execute on function public.get_portfolio_visibility(uuid) to anon, authenticated;

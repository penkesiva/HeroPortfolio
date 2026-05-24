-- Unified portfolios: child + personal profiles in one table.
-- Self-account timelines move from profiles.id → portfolio profile UUID.

alter table public.child_profiles
  add column if not exists portfolio_kind text not null default 'child'
    check (portfolio_kind in ('child', 'personal'));

alter table public.child_profiles
  add column if not exists is_primary boolean not null default false;

comment on column public.child_profiles.portfolio_kind is
  'child = guardian-managed dependent; personal = student-owned portfolio (music, sports, main, etc.)';

comment on column public.child_profiles.is_primary is
  'True for the default personal portfolio created for self accounts.';

-- One primary personal portfolio per owner account.
create unique index if not exists child_profiles_one_primary_per_owner
  on public.child_profiles (parent_user_id)
  where is_primary = true and portfolio_kind = 'personal';

-- profile_views must reference portfolio UUIDs (child_profiles), not auth profiles.
alter table public.profile_views
  drop constraint if exists profile_views_portfolio_user_id_fkey;

-- Migrate existing self-account timelines into a primary portfolio profile.
do $$
declare
  r record;
  new_id uuid;
  profile_name text;
begin
  for r in
    select p.id, p.display_name, coalesce(p.is_public, false) as is_public
    from public.profiles p
    where p.account_kind = 'self'
      and not exists (
        select 1
        from public.child_profiles cp
        where cp.parent_user_id = p.id
          and cp.is_primary = true
          and cp.portfolio_kind = 'personal'
      )
  loop
    new_id := gen_random_uuid();
    profile_name := coalesce(nullif(trim(r.display_name), ''), 'My Portfolio');

    insert into public.child_profiles (
      id,
      parent_user_id,
      display_name,
      portfolio_kind,
      is_primary,
      is_public
    ) values (
      new_id,
      r.id,
      profile_name,
      'personal',
      true,
      r.is_public
    );

    update public.year_blocks set user_id = new_id where user_id = r.id;
    update public.events set user_id = new_id where user_id = r.id;
    update public.event_images set user_id = new_id where user_id = r.id;
    update public.profile_views set portfolio_user_id = new_id where portfolio_user_id = r.id;
  end loop;
end $$;

-- Drop analytics rows still keyed to auth profile ids (pre-migration leftovers).
delete from public.profile_views pv
where exists (select 1 from public.profiles p where p.id = pv.portfolio_user_id)
  and not exists (select 1 from public.child_profiles cp where cp.id = pv.portfolio_user_id);

alter table public.profile_views
  drop constraint if exists profile_views_portfolio_user_id_fkey;

alter table public.profile_views
  add constraint profile_views_portfolio_user_id_fkey
  foreign key (portfolio_user_id)
  references public.child_profiles(id)
  on delete cascade;

drop policy if exists "Owner can read own views" on public.profile_views;

create policy "Owner can read own views"
  on public.profile_views for select
  using (
    auth.uid() = portfolio_user_id
    or portfolio_user_id in (
      select id from public.child_profiles where parent_user_id = auth.uid()
    )
  );

-- Visibility RPC: portfolios live in child_profiles after unification.
create or replace function public.get_portfolio_visibility(p_portfolio_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.child_profiles where id = p_portfolio_id) then
      (select case when is_public then 'public' else 'private' end
         from public.child_profiles where id = p_portfolio_id)
    when exists (select 1 from public.profiles where id = p_portfolio_id) then
      (select case when coalesce(is_public, false) then 'public' else 'private' end
         from public.profiles where id = p_portfolio_id)
    else 'not_found'
  end;
$$;

revoke all on function public.get_portfolio_visibility(uuid) from public;
grant execute on function public.get_portfolio_visibility(uuid) to anon, authenticated;

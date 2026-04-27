-- Per badge-category celebration: each category fires at most once when first earned in that track.
alter table public.profiles
  add column if not exists celebrated_badge_categories text[] not null default '{}';

comment on column public.profiles.celebrated_badge_categories is
  'BadgeCategory values (milestone, sports, community, …) for which the unlock celebration has already run.';

-- Users who already saw the legacy one-time party: treat milestone as celebrated so it does not replay.
update public.profiles
set celebrated_badge_categories = array['milestone']::text[]
where coalesce(has_celebrated, false) = true
  and celebrated_badge_categories = '{}';

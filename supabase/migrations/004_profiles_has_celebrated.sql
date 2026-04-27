-- One-time first-contribution celebration flag (set after party is shown)
alter table public.profiles
  add column if not exists has_celebrated boolean not null default false;

comment on column public.profiles.has_celebrated is
  'True after the one-time celebration (first new badge category unlock on save) has been claimed.';

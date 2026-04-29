-- Who the portfolio is for: student (self) vs parent/guardian (multi-child model later).
-- NULL = user must complete /onboarding/who once. Existing rows are treated as self.

alter table public.profiles
  add column if not exists account_kind text
  check (account_kind is null or account_kind in ('self', 'guardian'));

comment on column public.profiles.account_kind is
  'self = one portfolio for the logged-in student; guardian = parent operator (child profiles to follow). NULL until onboarding choice.';

-- Current production users: treat as student / self-serve accounts.
update public.profiles
set account_kind = 'self'
where account_kind is null;

-- Add amount_raised column to events table
-- Self-reported donation/fundraising amount in USD (optional)
alter table public.events
  add column if not exists amount_raised numeric(10, 2) default null;

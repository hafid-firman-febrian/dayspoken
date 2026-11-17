-- Plan limits are configuration, never hardcoded in the app or in functions.
-- One row per plan, plus one row named 'global' with the caps for the whole app.

create table public.plan_limits (
  plan text primary key,
  recordings_per_day integer not null check (recordings_per_day >= 0),
  asks_per_day integer not null check (asks_per_day >= 0)
);

comment on table public.plan_limits is
  'Daily limits per plan. The row named global holds the caps for the whole app.';

insert into public.plan_limits (plan, recordings_per_day, asks_per_day) values
  ('free', 3, 5),
  ('pro', 10, 50),
  -- Placeholder numbers for the global caps. The change that counts quotas
  -- (add-ai-processing-pipeline) tunes them after reading the AI quota page.
  ('global', 100, 200);

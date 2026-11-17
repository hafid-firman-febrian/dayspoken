-- Row-level security, column grants, and policies for every table in public.
--
-- Two layers, both needed:
--   * RLS decides which ROWS a user can touch.
--   * Column grants decide which COLUMNS. RLS alone cannot stop a user from setting
--     status = 'ready' on their own row.
--
-- Supabase gives anon, authenticated, and service_role full rights on every new public
-- table by default. So we revoke first and grant back only what the specs allow.

alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.ask_logs enable row level security;
alter table public.plan_limits enable row level security;

revoke all on table
  public.profiles,
  public.entries,
  public.ask_logs,
  public.plan_limits
from anon, authenticated;

-- The server role (Edge Functions, secret key) keeps full access. It also bypasses RLS.
grant all on table
  public.profiles,
  public.entries,
  public.ask_logs,
  public.plan_limits
to service_role;

-- profiles: read your own; change only timezone and reminder time.
-- No insert (the sign-up trigger creates it) and no delete (removing the auth user does).
grant select on public.profiles to authenticated;
grant update (timezone, reminder_time) on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- entries: create with capture fields only; edit title, mood, and tags of a ready entry.
-- user_id is not insertable: it defaults to the caller (auth.uid()).
grant select, delete on public.entries to authenticated;
grant insert (id, local_date, recorded_at, duration_sec, audio_path, prompt)
  on public.entries to authenticated;
grant update (title, mood, tags) on public.entries to authenticated;

create policy entries_select_own on public.entries
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy entries_insert_own on public.entries
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy entries_update_own on public.entries
  for update to authenticated
  using (user_id = (select auth.uid()) and status = 'ready')
  with check (user_id = (select auth.uid()));

create policy entries_delete_own on public.entries
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ask_logs: read and delete your own. Answers are written by the server only.
grant select, delete on public.ask_logs to authenticated;

create policy ask_logs_select_own on public.ask_logs
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy ask_logs_delete_own on public.ask_logs
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- plan_limits: signed-in users read the real plans (the quota UI), never the global row.
grant select on public.plan_limits to authenticated;

create policy plan_limits_select_plans on public.plan_limits
  for select to authenticated
  using (plan <> 'global');

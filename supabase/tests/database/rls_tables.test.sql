begin;
select plan(7);

-- 1. Every table in public has RLS enabled. A new table without RLS fails here by name.
select is_empty(
  $$ select c.relname
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind in ('r', 'p')
       and not c.relrowsecurity $$,
  'every table in public has row-level security enabled'
);

-- 2. anon has no privilege on any table or column in public.
select is_empty(
  $$ select table_name, privilege_type
     from information_schema.role_table_grants
     where grantee = 'anon' and table_schema = 'public' $$,
  'anon has no table-level privilege in public'
);

select is_empty(
  $$ select table_name, column_name, privilege_type
     from information_schema.column_privileges
     where grantee = 'anon' and table_schema = 'public' $$,
  'anon has no column-level privilege in public'
);

-- 3. authenticated table-level privileges are exactly the ones in design D5.
select results_eq(
  $$ select table_name::text collate "default", privilege_type::text collate "default"
     from information_schema.role_table_grants
     where grantee = 'authenticated' and table_schema = 'public'
     order by 1, 2 $$,
  $$ values
       ('ask_logs', 'DELETE'),
       ('ask_logs', 'SELECT'),
       ('entries', 'DELETE'),
       ('entries', 'SELECT'),
       ('plan_limits', 'SELECT'),
       ('profiles', 'SELECT') $$,
  'authenticated can only read profiles and plan_limits, and read and delete ask_logs and entries'
);

-- 4. authenticated can write only these columns (INSERT and UPDATE are column-level).
select results_eq(
  $$ select table_name::text collate "default", column_name::text collate "default"
     from information_schema.column_privileges
     where grantee = 'authenticated' and table_schema = 'public'
       and privilege_type = 'INSERT'
     order by 1, 2 $$,
  $$ values
       ('entries', 'audio_path'),
       ('entries', 'duration_sec'),
       ('entries', 'id'),
       ('entries', 'local_date'),
       ('entries', 'prompt'),
       ('entries', 'recorded_at') $$,
  'authenticated can insert only the capture fields of an entry'
);

select results_eq(
  $$ select table_name::text collate "default", column_name::text collate "default"
     from information_schema.column_privileges
     where grantee = 'authenticated' and table_schema = 'public'
       and privilege_type = 'UPDATE'
     order by 1, 2 $$,
  $$ values
       ('entries', 'mood'),
       ('entries', 'tags'),
       ('entries', 'title'),
       ('profiles', 'reminder_time'),
       ('profiles', 'timezone') $$,
  'authenticated can update only title, mood, tags, timezone, and reminder_time'
);

-- 5. The server role keeps full access to every table.
select is(
  (select count(*)::int
   from information_schema.role_table_grants
   where grantee = 'service_role' and table_schema = 'public'
     and table_name in ('profiles', 'entries', 'ask_logs', 'plan_limits')
     and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  16,
  'service_role can select, insert, update, and delete on all four tables'
);

select * from finish();
rollback;

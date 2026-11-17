begin;
select plan(6);

-- The only function in public that an anonymous visitor can execute is ping().
select results_eq(
  $$ select p.proname::text collate "default"
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and has_function_privilege('anon', p.oid, 'EXECUTE')
     order by 1 $$,
  $$ values ('ping'::text) $$,
  'anon can execute only ping in the public schema'
);

-- Signed-in users get ping and nothing else: trigger helpers are not callable through the API.
select results_eq(
  $$ select p.proname::text collate "default"
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and has_function_privilege('authenticated', p.oid, 'EXECUTE')
     order by 1 $$,
  $$ values ('ping'::text) $$,
  'authenticated can execute only ping in the public schema'
);

-- Pure helpers live in "private", which anon cannot even enter.
select ok(
  not has_schema_privilege('anon', 'private', 'USAGE'),
  'anon has no access to the private schema'
);

select ok(
  has_schema_privilege('authenticated', 'private', 'USAGE'),
  'authenticated can use the private schema (the generated search column needs it)'
);

-- ping() answers for an anonymous visitor.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(public.ping(), 'ok', 'ping returns ok for an anonymous visitor');

-- And a trigger helper is refused.
select throws_ok(
  $$ select public.handle_new_user() $$,
  '42501', null,
  'an anonymous visitor cannot call a trigger helper'
);

select * from finish();
rollback;

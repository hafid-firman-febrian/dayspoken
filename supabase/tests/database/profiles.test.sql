begin;
select plan(9);

insert into auth.users (id, email)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.com');

select is(
  (select count(*)::int from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1,
  'a profile exists at once after sign-up'
);

select results_eq(
  $$ select timezone, plan, is_demo, reminder_time
     from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  $$ values ('UTC'::text, 'free'::text, false, null::time) $$,
  'new profile has the default timezone, plan, is_demo, and no reminder time'
);

select throws_ok(
  $$ update public.profiles set plan = 'enterprise'
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '23503',
  null,
  'a plan with no row in plan_limits is rejected'
);

select throws_ok(
  $$ update public.profiles set plan = 'global'
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '23514',
  null,
  'the global row is not a plan a profile can have'
);

select lives_ok(
  $$ update public.profiles set plan = 'pro'
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'a real plan is accepted'
);

select lives_ok(
  $$ update public.profiles set timezone = 'Asia/Jakarta'
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'a real time zone name is accepted'
);

select throws_ok(
  $$ update public.profiles set timezone = 'Mars/Base'
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '22023',
  'Unknown time zone: Mars/Base',
  'an unknown time zone name is rejected'
);

select throws_ok(
  $$ update public.profiles set timezone = ''
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  null,
  null,
  'an empty time zone name is rejected'
);

-- Removing the auth user removes the profile.
delete from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0,
  'removing the auth user removes the profile'
);

select * from finish();
rollback;

begin;
select plan(23);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@example.com');

insert into public.ask_logs (id, user_id, local_date, question, answer) values
  ('cccccccc-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001',
   '2026-11-17', 'A question', 'A answer'),
  ('cccccccc-0000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000001',
   '2026-11-17', 'B question', 'B answer');

-- ===== Act as user A =====
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- profiles
select is(
  (select count(*)::int from public.profiles),
  1,
  'A sees only their own profile'
);

select lives_ok(
  $$ update public.profiles set timezone = 'Asia/Jakarta', reminder_time = '08:30'
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'A can change their timezone and reminder time'
);

select results_eq(
  $$ select timezone, reminder_time from public.profiles $$,
  $$ values ('Asia/Jakarta'::text, '08:30'::time) $$,
  'the timezone and reminder time were stored'
);

select throws_ok(
  $$ update public.profiles set plan = 'pro' where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '42501', null, 'A cannot upgrade their own plan'
);

select throws_ok(
  $$ update public.profiles set is_demo = true where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '42501', null, 'A cannot mark themselves as a demo user'
);

select throws_ok(
  $$ insert into public.profiles (id) values ('dddddddd-0000-0000-0000-000000000001') $$,
  '42501', null, 'A cannot create a profile directly'
);

select throws_ok(
  $$ delete from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '42501', null, 'A cannot delete a profile directly'
);

select lives_ok(
  $$ update public.profiles set timezone = 'Europe/Paris'
     where id = 'bbbbbbbb-0000-0000-0000-000000000001' $$,
  'A changing B''s profile does not error (the row is invisible)'
);

-- ask_logs
select is(
  (select count(*)::int from public.ask_logs),
  1,
  'A sees only their own ask log'
);

select throws_ok(
  $$ insert into public.ask_logs (local_date, question, answer)
     values ('2026-11-17', 'Forged?', 'Forged answer') $$,
  '42501', null, 'A cannot write an ask log (answers come from the server)'
);

select throws_ok(
  $$ update public.ask_logs set answer = 'edited' $$,
  '42501', null, 'A cannot edit an ask log'
);

select lives_ok(
  $$ delete from public.ask_logs where id = 'cccccccc-0000-0000-0000-0000000000b1' $$,
  'A deleting B''s ask log does not error (the row is invisible)'
);

select lives_ok(
  $$ delete from public.ask_logs where id = 'cccccccc-0000-0000-0000-0000000000a1' $$,
  'A can delete their own ask log'
);

-- plan_limits
select results_eq(
  $$ select plan from public.plan_limits order by plan $$,
  $$ values ('free'::text), ('pro') $$,
  'A sees the free and pro plans and not the global row'
);

select throws_ok(
  $$ update public.plan_limits set recordings_per_day = 999 where plan = 'free' $$,
  '42501', null, 'A cannot raise a limit'
);

select throws_ok(
  $$ insert into public.plan_limits values ('vip', 99, 99) $$,
  '42501', null, 'A cannot add a plan'
);

-- ===== Back to the owner role: B's data is untouched =====
reset role;

select is(
  (select timezone from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'UTC',
  'B''s profile was not changed by A'
);

select is(
  (select count(*)::int from public.ask_logs where id = 'cccccccc-0000-0000-0000-0000000000b1'),
  1,
  'B''s ask log still exists'
);

-- ===== Anonymous visitor =====
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok($$ select * from public.entries $$, '42501', null, 'anon cannot read entries');
select throws_ok($$ select * from public.profiles $$, '42501', null, 'anon cannot read profiles');
select throws_ok($$ select * from public.ask_logs $$, '42501', null, 'anon cannot read ask_logs');
select throws_ok($$ select * from public.plan_limits $$, '42501', null, 'anon cannot read plan_limits');
select throws_ok(
  $$ insert into public.plan_limits values ('vip', 99, 99) $$,
  '42501', null, 'anon cannot write plan_limits'
);

select * from finish();
rollback;

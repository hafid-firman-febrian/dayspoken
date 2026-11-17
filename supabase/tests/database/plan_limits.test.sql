begin;
select plan(5);

select is(
  (select count(*)::int from public.plan_limits),
  3,
  'plan_limits has exactly three rows'
);

select results_eq(
  $$ select plan, recordings_per_day, asks_per_day from public.plan_limits order by plan $$,
  $$ values ('free'::text, 3, 5), ('global', 100, 200), ('pro', 10, 50) $$,
  'free is 3/5, pro is 10/50, and global holds the app-wide caps'
);

select throws_ok(
  $$ insert into public.plan_limits values ('bad', -1, 1) $$,
  '23514',
  null,
  'a negative recordings limit is rejected'
);

select throws_ok(
  $$ insert into public.plan_limits values ('bad', 1, -1) $$,
  '23514',
  null,
  'a negative asks limit is rejected'
);

-- "Changing a limit needs no app release": it is one UPDATE and the next read sees it.
update public.plan_limits set recordings_per_day = 4 where plan = 'free';
select is(
  (select recordings_per_day from public.plan_limits where plan = 'free'),
  4,
  'a changed limit is returned by the next read'
);

select * from finish();
rollback;

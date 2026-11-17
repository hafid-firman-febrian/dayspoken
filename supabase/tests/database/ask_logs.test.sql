begin;
select plan(4);

insert into auth.users (id, email)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.com');

insert into public.ask_logs (id, user_id, local_date, question, answer)
values (
  'cccccccc-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '2026-11-17', 'What made me happy?', 'Your walk on Tuesday.'
);

select is(
  (select citations from public.ask_logs where id = 'cccccccc-0000-0000-0000-000000000001'),
  '[]'::jsonb,
  'citations default to an empty list'
);

select lives_ok(
  $$ update public.ask_logs
     set citations = '[{"entry_id": "eeeeeeee-0000-0000-0000-000000000001", "quote": "a walk"}]'
     where id = 'cccccccc-0000-0000-0000-000000000001' $$,
  'citations that are a list are accepted'
);

select throws_ok(
  $$ update public.ask_logs
     set citations = '{"entry_id": "x", "quote": "y"}'
     where id = 'cccccccc-0000-0000-0000-000000000001' $$,
  '23514', null,
  'citations that are a single object instead of a list are rejected'
);

select has_index('public', 'ask_logs', 'ask_logs_user_created_at_idx', 'ask logs are indexed by user and time');

select * from finish();
rollback;

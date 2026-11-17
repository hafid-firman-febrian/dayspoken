begin;
select plan(29);

-- Users A and B. Entries: EA1 (A, ready, AI mood 3), EA2 (A, analyzing), EB1 (B, ready).
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@example.com');

insert into public.entries
  (id, user_id, local_date, recorded_at, duration_sec, audio_path, status, title, mood, mood_source)
values
  ('eeeeeeee-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001',
   '2026-11-17', now(), 60,
   'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a1.m4a',
   'ready', 'A ready', 3, 'ai'),
  ('eeeeeeee-0000-0000-0000-0000000000a2', 'aaaaaaaa-0000-0000-0000-000000000001',
   '2026-11-17', now(), 60,
   'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a2.m4a',
   'analyzing', 'A analyzing', null, null),
  ('eeeeeeee-0000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000001',
   '2026-11-17', now(), 60,
   'bbbbbbbb-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000b1.m4a',
   'ready', 'B ready', 3, 'ai');

-- ===== Act as user A =====
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- Reading
select is(
  (select count(*)::int from public.entries),
  2,
  'A sees only their own 2 entries'
);

select is(
  (select count(*)::int from public.entries where id = 'eeeeeeee-0000-0000-0000-0000000000b1'),
  0,
  'B''s entry is invisible to A'
);

-- Writing to another user's entry changes nothing (the row is invisible).
select lives_ok(
  $$ update public.entries set title = 'hacked'
     where id = 'eeeeeeee-0000-0000-0000-0000000000b1' $$,
  'A updating B''s entry does not error'
);
select lives_ok(
  $$ delete from public.entries where id = 'eeeeeeee-0000-0000-0000-0000000000b1' $$,
  'A deleting B''s entry does not error'
);

-- Creating an entry with the capture fields works and belongs to A.
select lives_ok(
  $$ insert into public.entries (id, local_date, recorded_at, duration_sec, audio_path, prompt)
     values ('eeeeeeee-0000-0000-0000-0000000000a3', '2026-11-17', now(), 45,
             'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a3.m4a',
             'What made you smile?') $$,
  'A can create an entry with only the capture fields'
);

select results_eq(
  $$ select user_id, status from public.entries
     where id = 'eeeeeeee-0000-0000-0000-0000000000a3' $$,
  $$ values ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'uploading'::public.entry_status) $$,
  'the new entry belongs to A and is uploading'
);

-- Forging results or owners is refused (column privileges).
select throws_ok(
  $$ insert into public.entries (id, local_date, recorded_at, duration_sec, audio_path, status)
     values ('eeeeeeee-0000-0000-0000-0000000000a4', '2026-11-17', now(), 45,
             'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a4.m4a',
             'ready') $$,
  '42501', null,
  'A cannot create an entry that is already ready'
);

select throws_ok(
  $$ insert into public.entries (id, local_date, recorded_at, duration_sec, audio_path, transcript)
     values ('eeeeeeee-0000-0000-0000-0000000000a4', '2026-11-17', now(), 45,
             'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a4.m4a',
             'forged transcript') $$,
  '42501', null,
  'A cannot create an entry with a transcript'
);

select throws_ok(
  $$ insert into public.entries (id, user_id, local_date, recorded_at, duration_sec, audio_path)
     values ('eeeeeeee-0000-0000-0000-0000000000a4', 'bbbbbbbb-0000-0000-0000-000000000001',
             '2026-11-17', now(), 45,
             'bbbbbbbb-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a4.m4a') $$,
  '42501', null,
  'A cannot create an entry for B'
);

-- Light edits on a ready entry
select lives_ok(
  $$ update public.entries set title = 'New title', tags = array['calm']
     where id = 'eeeeeeee-0000-0000-0000-0000000000a1' $$,
  'A can change the title and tags of a ready entry'
);

select results_eq(
  $$ select title, tags from public.entries where id = 'eeeeeeee-0000-0000-0000-0000000000a1' $$,
  $$ values ('New title'::text, array['calm']::text[]) $$,
  'the title and tags were stored'
);

-- Editing while processing changes no row.
select lives_ok(
  $$ update public.entries set title = 'Edited too early'
     where id = 'eeeeeeee-0000-0000-0000-0000000000a2' $$,
  'A editing an analyzing entry does not error'
);

select is(
  (select title from public.entries where id = 'eeeeeeee-0000-0000-0000-0000000000a2'),
  'A analyzing',
  'the analyzing entry was not changed'
);

-- Mood edit: the source becomes 'user'.
select lives_ok(
  $$ update public.entries set mood = 5 where id = 'eeeeeeee-0000-0000-0000-0000000000a1' $$,
  'A can change the mood of a ready entry'
);

select results_eq(
  $$ select mood::int, mood_source from public.entries
     where id = 'eeeeeeee-0000-0000-0000-0000000000a1' $$,
  $$ values (5, 'user'::public.mood_source) $$,
  'after A changes the mood, the mood source is user'
);

-- Columns the server owns
select throws_ok(
  $$ update public.entries set status = 'ready' where id = 'eeeeeeee-0000-0000-0000-0000000000a1' $$,
  '42501', null, 'A cannot change the status'
);
select throws_ok(
  $$ update public.entries set transcript = 'x' where id = 'eeeeeeee-0000-0000-0000-0000000000a1' $$,
  '42501', null, 'A cannot change the transcript'
);
select throws_ok(
  $$ update public.entries set summary = 'x' where id = 'eeeeeeee-0000-0000-0000-0000000000a1' $$,
  '42501', null, 'A cannot change the summary'
);
select throws_ok(
  $$ update public.entries set embedding = array_fill(0.1::real, array[768])::extensions.vector
     where id = 'eeeeeeee-0000-0000-0000-0000000000a1' $$,
  '42501', null, 'A cannot change the embedding'
);
select throws_ok(
  $$ update public.entries set user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
     where id = 'eeeeeeee-0000-0000-0000-0000000000a1' $$,
  '42501', null, 'A cannot hand an entry to another user'
);

-- Deleting an own entry works.
select lives_ok(
  $$ delete from public.entries where id = 'eeeeeeee-0000-0000-0000-0000000000a3' $$,
  'A can delete their own entry'
);

-- ===== Back to the owner role: B's entry must be untouched =====
reset role;

select is(
  (select title from public.entries where id = 'eeeeeeee-0000-0000-0000-0000000000b1'),
  'B ready',
  'B''s entry still exists and was not changed by A'
);

select is(
  (select count(*)::int from public.entries where id = 'eeeeeeee-0000-0000-0000-0000000000a3'),
  0,
  'the entry A deleted is gone'
);

-- ===== Act as user B: A's entries are invisible =====
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.entries),
  1,
  'B sees only their own entry'
);

-- ===== Act as the server role =====
reset role;
set local role service_role;

select lives_ok(
  $$ update public.entries
     set status = 'ready', transcript = 'Today I walked.', title = 'A walk',
         summary = 'A short walk.', mood = 2, mood_source = 'ai', tags = array['walk'],
         language = 'en', embedding_status = 'ready'
     where id = 'eeeeeeee-0000-0000-0000-0000000000a2' $$,
  'the server role can complete an entry'
);

select results_eq(
  $$ select status, mood::int, mood_source from public.entries
     where id = 'eeeeeeee-0000-0000-0000-0000000000a2' $$,
  $$ values ('ready'::public.entry_status, 2, 'ai'::public.mood_source) $$,
  'the server keeps the AI mood source'
);

-- The server rewriting a mood (here A's edited entry, source 'user') keeps the source it sets.
select lives_ok(
  $$ update public.entries set mood = 4, mood_source = 'ai'
     where id = 'eeeeeeee-0000-0000-0000-0000000000a1' $$,
  'the server role can rewrite a mood together with its source'
);

select is(
  (select mood_source::text from public.entries where id = 'eeeeeeee-0000-0000-0000-0000000000a1'),
  'ai',
  'the mood-source trigger does not override the server role'
);

-- The server role can edit an entry that is not ready (users cannot).
select lives_ok(
  $$ update public.entries set error_code = 'TRANSCRIBE_FAILED', status = 'failed'
     where id = 'eeeeeeee-0000-0000-0000-0000000000b1' $$,
  'the server role can mark any entry failed'
);

select * from finish();
rollback;

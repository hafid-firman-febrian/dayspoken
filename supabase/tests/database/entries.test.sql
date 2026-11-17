begin;
select plan(28);

-- Two users. A signs-up profile row is created by the trigger.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@example.com');

-- One valid entry to work on (entry E1 of user A).
insert into public.entries (id, user_id, local_date, recorded_at, duration_sec, audio_path)
values (
  'eeeeeeee-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '2026-11-17', now(), 95,
  'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-000000000001.m4a'
);

-- Defaults
select results_eq(
  $$ select status, embedding_status, embedding is null, tags, mood is null, error_code is null
     from public.entries where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  $$ values ('uploading'::public.entry_status, 'pending'::public.embedding_status,
             true, '{}'::text[], true, true) $$,
  'a new entry is uploading, embedding pending, with no embedding, tags, or mood'
);

select throws_ok(
  $$ update public.entries set status = 'done'
     where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  '22P02', null,
  'an unknown status is rejected'
);

-- Capture fields
select throws_ok(
  $$ insert into public.entries (id, user_id, local_date, recorded_at, duration_sec, audio_path)
     values ('eeeeeeee-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
             '2026-11-17', now(), 95,
             'bbbbbbbb-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-000000000003.m4a') $$,
  '23514', null,
  'an audio path that starts with another user id is rejected'
);

select throws_ok(
  $$ insert into public.entries (id, user_id, local_date, recorded_at, duration_sec, audio_path)
     values ('eeeeeeee-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
             '2026-11-17', now(), 95,
             'aaaaaaaa-0000-0000-0000-000000000001/notes.mp3') $$,
  '23514', null,
  'an audio path that is not {user_id}/{entry_id}.m4a is rejected'
);

select throws_ok(
  $$ insert into public.entries (id, user_id, local_date, recorded_at, duration_sec, audio_path)
     values ('eeeeeeee-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
             '2026-11-17', now(), 0,
             'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-000000000003.m4a') $$,
  '23514', null,
  'a duration of 0 seconds is rejected'
);

select throws_ok(
  $$ insert into public.entries (id, user_id, local_date, recorded_at, duration_sec, audio_path)
     values ('eeeeeeee-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
             '2026-11-17', now(), 191,
             'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-000000000003.m4a') $$,
  '23514', null,
  'a duration of 191 seconds is rejected'
);

select lives_ok(
  $$ insert into public.entries (id, user_id, local_date, recorded_at, duration_sec, audio_path)
     values ('eeeeeeee-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001',
             '2026-11-17', now(), 190,
             'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-000000000004.m4a') $$,
  'a duration of 190 seconds (the upper bound) is accepted'
);

-- Tags
select throws_ok(
  $$ update public.entries set tags = array['a','b','c','d','e','f']
     where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  '23514', null,
  'six tags are rejected'
);

select throws_ok(
  $$ update public.entries set tags = array['Work']
     where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  '23514', null,
  'an uppercase tag is rejected'
);

select throws_ok(
  $$ update public.entries set tags = array['']
     where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  '23514', null,
  'an empty tag is rejected'
);

select lives_ok(
  $$ update public.entries set tags = array['a','b','c','d','e']
     where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  'five lowercase tags are accepted'
);

-- Mood
select throws_ok(
  $$ update public.entries set mood = 6, mood_source = 'ai'
     where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  '23514', null,
  'a mood of 6 is rejected'
);

select throws_ok(
  $$ update public.entries set mood = 3
     where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  '23514', null,
  'a mood without a mood source is rejected'
);

select lives_ok(
  $$ update public.entries set mood = 4, mood_source = 'ai'
     where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  'a mood with a source is accepted'
);

-- Full-text search ('simple' configuration)
update public.entries
set transcript = 'I gave a presentation to the whole team today',
    tags = array['family']
where id = 'eeeeeeee-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from public.entries where search @@ plainto_tsquery('simple', 'presentation')),
  1,
  'a word in the transcript matches the search'
);

select is(
  (select count(*)::int from public.entries where search @@ plainto_tsquery('simple', 'family')),
  1,
  'a tag matches the search'
);

update public.entries set title = 'Budget plan'
where id = 'eeeeeeee-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from public.entries where search @@ plainto_tsquery('simple', 'budget')),
  1,
  'a changed title matches the search with no other step'
);

update public.entries set summary = 'Talked about rainbows'
where id = 'eeeeeeee-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from public.entries where search @@ plainto_tsquery('simple', 'rainbows')),
  1,
  'a word in the summary matches the search'
);

-- Embedding: exactly 768 numbers
select lives_ok(
  $$ update public.entries
     set embedding = array_fill(0.1::real, array[768])::extensions.vector
     where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  'an embedding of 768 numbers is accepted'
);

select throws_ok(
  $$ update public.entries
     set embedding = array_fill(0.1::real, array[100])::extensions.vector
     where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  '22000', null,
  'an embedding of 100 numbers is rejected'
);

-- Indexes
select has_index('public', 'entries', 'entries_user_local_date_idx', 'entries are indexed by user and day');
select has_index('public', 'entries', 'entries_user_recorded_at_idx', 'entries are indexed by user and recording time');
select has_index('public', 'entries', 'entries_search_idx', 'the search column is indexed');
select has_index('public', 'entries', 'entries_embedding_idx', 'the embedding column is indexed');

-- Timestamps
create temp table before_update as
  select created_at, updated_at from public.entries
  where id = 'eeeeeeee-0000-0000-0000-000000000001';

update public.entries set title = 'Budget plan, revised'
where id = 'eeeeeeee-0000-0000-0000-000000000001';

select ok(
  (select e.updated_at > b.updated_at from public.entries e, before_update b
   where e.id = 'eeeeeeee-0000-0000-0000-000000000001'),
  'updated_at moves forward on every update'
);

select ok(
  (select e.created_at = b.created_at from public.entries e, before_update b
   where e.id = 'eeeeeeee-0000-0000-0000-000000000001'),
  'created_at does not change on update'
);

-- Removing the user removes entries and ask logs with the profile.
insert into public.ask_logs (user_id, local_date, question, answer)
values ('aaaaaaaa-0000-0000-0000-000000000001', '2026-11-17', 'How was my week?', 'Busy.');

select is(
  (select count(*)::int from public.entries where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  2,
  'user A has 2 entries before removal'
);

delete from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from (
     select 1 from public.entries where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     union all
     select 1 from public.ask_logs where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     union all
     select 1 from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'
   ) as leftovers),
  0,
  'removing the auth user removes their profile, entries, and ask logs'
);

select * from finish();
rollback;

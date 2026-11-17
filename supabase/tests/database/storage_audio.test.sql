begin;
select plan(25);

-- Bucket settings. (The size and type limits are enforced by the Storage API, so the real
-- refusals are checked in supabase/tests/api-check.sh. Here we check the configuration.)
select is(
  (select public from storage.buckets where id = 'audio'),
  false,
  'the audio bucket is private'
);

select is(
  (select file_size_limit from storage.buckets where id = 'audio'),
  5242880::bigint,
  'the audio bucket limits files to 5 MB'
);

select is(
  (select allowed_mime_types from storage.buckets where id = 'audio'),
  array['audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac'],
  'the audio bucket accepts only m4a/aac audio types'
);

-- Users A and B, one entry each, and an existing audio file of B.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@example.com');

insert into public.entries (id, user_id, local_date, recorded_at, duration_sec, audio_path) values
  ('eeeeeeee-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001',
   '2026-11-17', now(), 60,
   'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a1.m4a'),
  ('eeeeeeee-0000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000001',
   '2026-11-17', now(), 60,
   'bbbbbbbb-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000b1.m4a');

insert into storage.objects (bucket_id, name) values
  ('audio', 'bbbbbbbb-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000b1.m4a');

-- Storage blocks direct DELETE statements unless this flag is set. We only want to test
-- our policies here, so the flag is set for the whole test.
select set_config('storage.allow_delete_query', 'true', true);

-- ===== Act as user A =====
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values
       ('audio', 'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a1.m4a') $$,
  'A can upload {A}/{entry}.m4a for their own entry'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
       ('audio', 'bbbbbbbb-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a1.m4a') $$,
  '42501', null,
  'A cannot upload into B''s folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
       ('audio', 'aaaaaaaa-0000-0000-0000-000000000001/notes.txt') $$,
  '42501', null,
  'A cannot upload a file whose name is not {entry}.m4a'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
       ('audio', 'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a1.mp3') $$,
  '42501', null,
  'A cannot upload an .mp3 for the entry'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
       ('audio', 'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000ff.m4a') $$,
  '42501', null,
  'A cannot upload audio for an entry that does not exist'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
       ('audio', 'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000b1.m4a') $$,
  '42501', null,
  'A cannot upload audio under B''s entry id'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('audio', 'loose-file.m4a') $$,
  '42501', null,
  'A cannot upload a file outside any user folder'
);

-- Reading
select is(
  (select count(*)::int from storage.objects where bucket_id = 'audio'),
  1,
  'A lists only their own file'
);

select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'audio' and name like 'bbbbbbbb-%'),
  0,
  'B''s file is invisible to A'
);

-- Replacing (a retried upload, upsert)
select lives_ok(
  $$ update storage.objects set metadata = '{"retry": 1}'::jsonb
     where bucket_id = 'audio'
       and name = 'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a1.m4a' $$,
  'A can replace their own file (a retried upload at the same path)'
);

select is(
  (select metadata ->> 'retry' from storage.objects
   where name = 'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a1.m4a'),
  '1',
  'the replacement was stored'
);

select throws_ok(
  $$ update storage.objects
     set name = 'aaaaaaaa-0000-0000-0000-000000000001/not-an-entry.m4a'
     where name = 'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a1.m4a' $$,
  '42501', null,
  'A cannot rename their file to a name that is not one of their entries'
);

select lives_ok(
  $$ update storage.objects set metadata = '{"hacked": 1}'::jsonb
     where name = 'bbbbbbbb-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000b1.m4a' $$,
  'A replacing B''s file does not error (the file is invisible)'
);

-- Deleting
select lives_ok(
  $$ delete from storage.objects
     where name = 'bbbbbbbb-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000b1.m4a' $$,
  'A deleting B''s file does not error (the file is invisible)'
);

select lives_ok(
  $$ delete from storage.objects
     where name = 'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a1.m4a' $$,
  'A can delete their own file'
);

-- ===== Back to the owner role: B's file was not touched =====
reset role;

select is(
  (select count(*)::int from storage.objects
   where name = 'bbbbbbbb-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000b1.m4a'
     and metadata is distinct from '{"hacked": 1}'::jsonb),
  1,
  'B''s file still exists and A did not change it'
);

select is(
  (select count(*)::int from storage.objects
   where name = 'aaaaaaaa-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000a1.m4a'),
  0,
  'the file A deleted is gone'
);

-- ===== Act as user B: B can read their own file =====
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::int from storage.objects where bucket_id = 'audio'),
  1,
  'B reads their own file'
);

-- ===== Anonymous visitor =====
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::int from storage.objects where bucket_id = 'audio'),
  0,
  'an anonymous visitor lists no audio file'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
       ('audio', 'bbbbbbbb-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-0000000000b1.m4a') $$,
  '42501', null,
  'an anonymous visitor cannot upload audio'
);

-- ===== Server role: can delete any file =====
reset role;
set local role service_role;

select lives_ok(
  $$ delete from storage.objects where bucket_id = 'audio'
     and name like 'bbbbbbbb-0000-0000-0000-000000000001/%' $$,
  'the server role can delete a user''s audio'
);

reset role;
select is(
  (select count(*)::int from storage.objects where bucket_id = 'audio'),
  0,
  'no audio file is left after the server cleanup'
);

select * from finish();
rollback;

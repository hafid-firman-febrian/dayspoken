-- Private bucket for the audio of each entry: audio/{user_id}/{entry_id}.m4a
--
-- The bucket is created here (not in config.toml) because only migrations reach the
-- cloud project. Size and type limits are enforced by the Storage API, not by SQL.
-- At about 32 kbps a 3-minute recording is about 0.7 MB, so 5 MB is generous headroom.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  false,
  5242880,
  array['audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Read and delete: only files in your own folder.
create policy "audio: owner reads own files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "audio: owner deletes own files" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Upload and replace: only for one of your own entries. entries.audio_path is constrained
-- to {user_id}/{id}.m4a, so "an entry of mine has exactly this audio_path" proves the
-- folder, the file name, and that the entry exists, with no parsing of the name.
-- Replace is allowed so a retried upload (upsert) at the same path works.
create policy "audio: owner uploads for own entry" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'audio'
    and exists (
      select 1 from public.entries e
      where e.audio_path = name
        and e.user_id = (select auth.uid())
    )
  );

create policy "audio: owner replaces for own entry" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'audio'
    and exists (
      select 1 from public.entries e
      where e.audio_path = name
        and e.user_id = (select auth.uid())
    )
  );

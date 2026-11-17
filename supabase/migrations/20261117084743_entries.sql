-- One journal entry per recording: capture fields, AI results, search, and embedding.

-- Pure helper functions live in "private", a schema the API does not expose, so nobody can
-- call them as /rpc endpoints. They must still be executable by the roles that write
-- entries, because Postgres recomputes the generated search column with the caller's rights.
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- tags: at most 5, each non-empty and already lowercase.
create function private.tags_are_valid(tags text[])
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(cardinality(tags), 0) <= 5
    and not exists (
      select 1 from unnest(tags) as t
      where t is null or t = '' or t <> lower(t)
    );
$$;

-- array_to_string is only STABLE, and a generated column needs IMMUTABLE expressions.
-- For text[] the result never depends on settings, so this wrapper is safe.
create function private.tags_to_text(tags text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select array_to_string(tags, ' ');
$$;

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  -- The default lets a signed-in user omit it (users cannot name another owner).
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,

  -- Capture fields
  local_date date not null,
  recorded_at timestamptz not null,
  -- The product limit is 180 s, enforced in the app. The extra 10 s absorbs recorder stop latency.
  duration_sec integer not null check (duration_sec between 1 and 190),
  -- Unique, and storage policies look entries up by it (see the storage_audio migration).
  audio_path text not null unique,
  language text,
  prompt text,

  -- Pipeline state
  status public.entry_status not null default 'uploading',
  error_code text,

  -- AI results
  transcript text,
  title text,
  summary text,
  mood smallint check (mood between 1 and 5),
  mood_source public.mood_source,
  tags text[] not null default '{}',

  -- One vector per entry (transcript + summary). gemini-embedding-2 cut to 768 dimensions.
  embedding extensions.vector(768),
  embedding_status public.embedding_status not null default 'pending',

  -- Full-text search over what the user can read. 'simple' = no stemming, any language.
  -- Postgres accepted this generated expression with the tags_to_text wrapper, so no
  -- trigger fallback is needed.
  search tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(transcript, '') || ' ' ||
      coalesce(private.tags_to_text(tags), '')
    )
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint entries_audio_path_matches
    check (audio_path = user_id::text || '/' || id::text || '.m4a'),
  constraint entries_tags_valid check (private.tags_are_valid(tags)),
  constraint entries_mood_pair check ((mood is null) = (mood_source is null))
);

-- Home and Journal read one user's entries by day, newest first.
create index entries_user_local_date_idx on public.entries (user_id, local_date);
create index entries_user_recorded_at_idx on public.entries (user_id, recorded_at desc);
-- Full-text search.
create index entries_search_idx on public.entries using gin (search);
-- Cosine similarity search (pgvector defaults: m = 16, ef_construction = 64).
create index entries_embedding_idx on public.entries
  using hnsw (embedding extensions.vector_cosine_ops);

-- updated_at changes on every update. clock_timestamp() (not now()) so two updates in
-- one transaction still differ.
create function public.entries_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function public.entries_set_updated_at();

-- When the signed-in user changes the mood, the source becomes 'user'. The server role
-- (Edge Functions) is not affected, so the pipeline can still write 'ai'.
create function public.entries_mark_user_mood()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and new.mood is distinct from old.mood then
    new.mood_source := 'user';
  end if;
  return new;
end;
$$;

create trigger entries_mark_user_mood
  before update on public.entries
  for each row execute function public.entries_mark_user_mood();

revoke all on function private.tags_are_valid(text[]) from public, anon;
revoke all on function private.tags_to_text(text[]) from public, anon;
grant execute on function private.tags_are_valid(text[]) to authenticated, service_role;
grant execute on function private.tags_to_text(text[]) to authenticated, service_role;

-- Trigger functions are never called through the API.
revoke all on function public.entries_set_updated_at() from public, anon, authenticated;
revoke all on function public.entries_mark_user_mood() from public, anon, authenticated;

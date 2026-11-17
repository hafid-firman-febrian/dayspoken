-- Extensions and enum types used by the Dayspoken schema.

-- pgvector. Supabase keeps extensions in the "extensions" schema.
create extension if not exists vector with schema extensions;

-- Where an entry is in the capture pipeline.
create type public.entry_status as enum (
  'uploading',
  'transcribing',
  'analyzing',
  'ready',
  'failed'
);

-- State of the embedding of one entry (tracked separately so it can be backfilled).
create type public.embedding_status as enum (
  'pending',
  'ready',
  'failed'
);

-- Who set the mood of an entry: the AI or the user.
create type public.mood_source as enum (
  'ai',
  'user'
);

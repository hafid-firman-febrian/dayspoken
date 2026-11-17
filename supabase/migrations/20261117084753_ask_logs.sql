-- One row per question the user asked their journal. Answers are written by the server.

create table public.ask_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  local_date date not null,
  question text not null,
  answer text not null,
  -- A list of { entry_id, quote }. SQL checks only the container; the Ask function
  -- (the only writer) validates each item with Zod.
  citations jsonb not null default '[]'::jsonb
    check (jsonb_typeof(citations) = 'array'),
  created_at timestamptz not null default now()
);

create index ask_logs_user_created_at_idx on public.ask_logs (user_id, created_at desc);

-- One profile per auth user, created automatically at sign-up.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'UTC',
  -- Must name a real plan. 'global' is the app-wide caps row, never a user's plan.
  plan text not null default 'free'
    references public.plan_limits (plan) on update cascade
    check (plan <> 'global'),
  is_demo boolean not null default false,
  reminder_time time,
  created_at timestamptz not null default now()
);

comment on column public.profiles.reminder_time is
  'Daily reminder, as a local time of day in the user''s timezone.';

-- A check constraint cannot look up pg_timezone_names, so a trigger validates the name.
-- Without it a bad name written through the API would break every server-side local_date.
create function public.profiles_validate_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform now() at time zone new.timezone;
  return new;
exception
  when invalid_parameter_value then
    raise exception 'Unknown time zone: %', new.timezone using errcode = '22023';
end;
$$;

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function public.profiles_validate_timezone();

-- Creates the profile when an auth user is created. It is the only way a profile is made.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger helpers are never called through the API.
revoke all on function public.profiles_validate_timezone() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

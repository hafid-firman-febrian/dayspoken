-- ping(): the one function an anonymous visitor may call.
-- The keep-alive workflow calls it once a day. A request through the API is database
-- activity, which is what stops the free project from pausing.

create function public.ping()
returns text
language sql
stable
set search_path = ''
as $$
  select 'ok'::text;
$$;

revoke all on function public.ping() from public, anon, authenticated;
grant execute on function public.ping() to anon, authenticated, service_role;

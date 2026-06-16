-- ============================================================================
-- auth shim — CI / local plain-Postgres only. NEVER applied on Supabase (which
-- already provides the auth schema, roles, and auth.uid()/auth.email()).
-- Gated behind APPLY_AUTH_SHIM=1 in the migrate runner.
--
-- Mirrors just enough of Supabase for the 0001–0003 migrations to apply and for
-- RLS to be exercisable: the `authenticated` role, an auth.users table, and the
-- auth.uid()/auth.email() claim accessors that the policies read.
-- ============================================================================
create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

create schema if not exists auth;
grant usage on schema auth to authenticated, anon, service_role;

create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  raw_user_meta_data jsonb not null default '{}',
  created_at         timestamptz not null default now()
);
grant select, insert, update, delete on auth.users to service_role;
grant select on auth.users to authenticated;

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;
create or replace function auth.email() returns text language sql stable as $$
  select current_setting('request.jwt.claims', true)::jsonb ->> 'email'
$$;
grant execute on function auth.uid() to authenticated, anon, service_role;
grant execute on function auth.email() to authenticated, anon, service_role;

-- Supabase grants table/sequence privileges to authenticated by default; replicate
-- so RLS (not a missing GRANT) is what gates access on tables the migrations create.
grant usage on schema public to authenticated, anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

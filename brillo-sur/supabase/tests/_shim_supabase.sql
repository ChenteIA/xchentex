-- SOLO PARA PRUEBAS LOCALES EN UN POSTGRES "PELADO".
-- Simula lo mínimo que Supabase ya trae: roles, esquema auth, auth.uid()
-- y el esquema extensions. NO ejecutar en el proyecto real de Supabase.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;

create schema if not exists auth;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pgtap with schema extensions;

create table if not exists auth.users (
  id uuid primary key,
  email text
);

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;

grant usage on schema auth, extensions to anon, authenticated, service_role;
grant execute on all functions in schema auth, extensions to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
-- Igual que Supabase: por defecto todo lo nuevo en public se concede a los roles de la API.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

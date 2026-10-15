-- =====================================================================
-- Brillo Sur · Esquema inicial
-- Tablas, RLS (punto 4), cifrado del celular (punto 5) y funciones RPC
-- con parámetros tipados (punto 13).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- Esquema privado: NO está expuesto por la API de Supabase (PostgREST solo
-- expone "public"). Aquí van las funciones auxiliares de las políticas.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.app_role as enum ('owner', 'staff');
create type public.order_status as enum ('pendiente', 'despachado', 'cobrado');
create type public.delivery_type as enum ('reparto', 'recojo');
create type public.item_form as enum ('unit', 'pack');

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.app_role not null default 'staff',
  full_name   text check (char_length(full_name) <= 80),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories (id) on delete restrict,
  name         text not null check (char_length(btrim(name)) between 1 and 120),
  unit_price   numeric(10, 2) not null check (unit_price > 0 and unit_price < 100000),
  pack_price   numeric(10, 2) check (pack_price > 0 and pack_price < 100000),
  pack_label   text check (char_length(btrim(pack_label)) between 1 and 30),
  image_path   text check (char_length(image_path) <= 200),
  sort_order   integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Precio y etiqueta del empaque van juntos: o ambos o ninguno.
  constraint products_pack_consistente check ((pack_price is null) = (pack_label is null))
);
create index products_category_idx on public.products (category_id);

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  business_name    text not null check (char_length(btrim(business_name)) between 2 and 80),
  -- Dato personal (Ley 29733): se guarda cifrado con pgp_sym_encrypt.
  -- La clave NO vive en la base de datos: la envía el servidor desde PHONE_ENCRYPTION_KEY.
  phone_encrypted  bytea not null,
  delivery_type    public.delivery_type not null default 'reparto',
  total            numeric(10, 2) not null check (total >= 0),
  status           public.order_status not null default 'pendiente',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id                     uuid primary key default gen_random_uuid(),
  order_id               uuid not null references public.orders (id) on delete cascade,
  product_id             uuid not null references public.products (id) on delete restrict,
  product_name_snapshot  text not null,
  pack_label_snapshot    text,
  form                   public.item_form not null,
  quantity               integer not null check (quantity between 1 and 999),
  unit_price_snapshot    numeric(10, 2) not null check (unit_price_snapshot > 0),
  subtotal               numeric(10, 2) not null,
  constraint order_items_subtotal_ok check (subtotal = quantity * unit_price_snapshot)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- Límite de intentos por clave (IP con hash, etc.). Puntos 11.
create table public.rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (key, window_start)
);

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger categories_touch before update on public.categories
  for each row execute function private.touch_updated_at();
create trigger products_touch before update on public.products
  for each row execute function private.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------
-- Funciones de rol (security definer para no depender de la RLS de profiles)
-- ---------------------------------------------------------------------
create function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active and p.role in ('owner', 'staff')
  )
$$;

create function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active and p.role = 'owner'
  )
$$;

revoke all on function private.is_staff(), private.is_owner() from public;
grant execute on function private.is_staff(), private.is_owner() to anon, authenticated;

-- Nadie cambia su propio rol ni se desactiva a sí mismo (punto 4).
create function private.profiles_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and new.id = auth.uid()
     and (new.role is distinct from old.role or new.active is distinct from old.active) then
    raise exception 'No puedes cambiar tu propio rol' using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'No se puede cambiar el id' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function private.profiles_guard();

-- ---------------------------------------------------------------------
-- RLS: activada en TODAS las tablas (punto 4)
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.rate_limits enable row level security;


-- Privilegios mínimos. Supabase concede todo por defecto a anon/authenticated:
-- se retira y se concede solo lo necesario (defensa en profundidad junto a RLS).
revoke all on public.profiles, public.categories, public.products,
              public.orders, public.order_items, public.rate_limits
  from anon, authenticated;

-- Catálogo: el público solo puede leer columnas necesarias.
grant select (id, name, sort_order, active) on public.categories to anon;
grant select (id, category_id, name, unit_price, pack_price, pack_label, image_path, sort_order, active)
  on public.products to anon;
grant select, insert, update, delete on public.categories, public.products to authenticated;

-- Pedidos: el personal lee todo y solo puede cambiar el estado.
grant select on public.orders, public.order_items to authenticated;
grant update (status) on public.orders to authenticated;

-- Perfiles: lectura; el owner puede cambiar rol/estado de OTROS usuarios.
grant select on public.profiles to authenticated;
grant update (role, active, full_name) on public.profiles to authenticated;

-- rate_limits: ningún privilegio para anon/authenticated (solo service_role vía RPC).

-- ---- categories ----
create policy "categorias: público lee activas"
  on public.categories for select to anon, authenticated
  using (active or (select private.is_staff()));

create policy "categorias: personal inserta"
  on public.categories for insert to authenticated
  with check ((select private.is_staff()));

create policy "categorias: personal actualiza"
  on public.categories for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "categorias: owner elimina"
  on public.categories for delete to authenticated
  using ((select private.is_owner()));

-- ---- products ----
create policy "productos: público lee activos de categorías activas"
  on public.products for select to anon, authenticated
  using (
    (select private.is_staff())
    or (active and exists (
      select 1 from public.categories c where c.id = category_id and c.active
    ))
  );

create policy "productos: personal inserta"
  on public.products for insert to authenticated
  with check ((select private.is_staff()));

create policy "productos: personal actualiza"
  on public.products for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "productos: owner elimina"
  on public.products for delete to authenticated
  using ((select private.is_owner()));

-- ---- orders / order_items: el público no lee ni escribe nada ----
create policy "pedidos: personal lee"
  on public.orders for select to authenticated
  using ((select private.is_staff()));

create policy "pedidos: personal cambia estado"
  on public.orders for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "items: personal lee"
  on public.order_items for select to authenticated
  using ((select private.is_staff()));

-- ---- profiles ----
create policy "perfiles: cada uno lee el suyo; owner lee todos"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_owner()));

create policy "perfiles: owner edita a otros"
  on public.profiles for update to authenticated
  using ((select private.is_owner()) and id <> (select auth.uid()))
  with check ((select private.is_owner()) and id <> (select auth.uid()));

-- ---------------------------------------------------------------------
-- RPC: crear pedido (punto 8 y 13)
-- El servidor envía SOLO producto, forma y cantidad. Los precios, subtotales
-- y el total se calculan aquí con los precios reales de la base de datos.
-- Solo service_role puede ejecutarla (desde el servidor de Next.js).
-- ---------------------------------------------------------------------
create function public.create_order(
  p_business_name  text,
  p_phone          text,
  p_delivery_type  public.delivery_type,
  p_items          jsonb,
  p_phone_key      text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order_id  uuid;
  v_total     numeric(10, 2) := 0;
  v_count     integer;
  v_found     integer;
  v_distinct  integer;
  v_priced    jsonb;
  v_lines     jsonb;
begin
  if p_business_name is null or char_length(btrim(p_business_name)) not between 2 and 80 then
    raise exception 'business_name inválido' using errcode = '22023';
  end if;
  if p_phone is null or p_phone !~ '^9[0-9]{8}$' then
    raise exception 'phone inválido' using errcode = '22023';
  end if;
  if p_phone_key is null or char_length(p_phone_key) < 32 then
    raise exception 'clave de cifrado inválida' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'items inválidos' using errcode = '22023';
  end if;

  v_count := jsonb_array_length(p_items);
  if v_count not between 1 and 40 then
    raise exception 'cantidad de ítems inválida' using errcode = '22023';
  end if;

  -- Ítems tipados (falla si algo no es uuid / entero / forma válida) y con
  -- el precio real: solo productos activos de categorías activas.
  select jsonb_agg(jsonb_build_object(
           'product_id', r.product_id, 'form', r.form, 'quantity', r.quantity,
           'product_name', p.name,
           'pack_label', case when r.form = 'pack' then p.pack_label end,
           'price', case when r.form = 'pack' then p.pack_price else p.unit_price end))
    into v_priced
  from (
    select (e ->> 'product_id')::uuid      as product_id,
           (e ->> 'form')::public.item_form as form,
           (e ->> 'quantity')::integer      as quantity
    from jsonb_array_elements(p_items) e
  ) r
  join public.products p on p.id = r.product_id and p.active
  join public.categories c on c.id = p.category_id and c.active;

  -- Todos los ítems deben existir, ser únicos, tener precio y cantidad válida.
  select count(*), count(distinct (x.product_id, x.form)), coalesce(sum(x.quantity * x.price), 0)
    into v_found, v_distinct, v_total
  from jsonb_to_recordset(coalesce(v_priced, '[]'::jsonb))
       as x(product_id uuid, form public.item_form, quantity integer, price numeric);

  if v_found <> v_count or v_distinct <> v_count then
    raise exception 'producto no disponible o repetido' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(v_priced) as x(quantity integer, price numeric)
    where x.price is null or x.quantity is null or x.quantity not between 1 and 999
  ) then
    raise exception 'ítem inválido' using errcode = '22023';
  end if;

  insert into public.orders (business_name, phone_encrypted, delivery_type, total)
  values (btrim(p_business_name),
          extensions.pgp_sym_encrypt(p_phone, p_phone_key),
          p_delivery_type,
          v_total)
  returning id into v_order_id;

  insert into public.order_items
    (order_id, product_id, product_name_snapshot, pack_label_snapshot, form,
     quantity, unit_price_snapshot, subtotal)
  select v_order_id, x.product_id, x.product_name, x.pack_label, x.form,
         x.quantity, x.price, x.quantity * x.price
  from jsonb_to_recordset(v_priced)
       as x(product_id uuid, form public.item_form, quantity integer,
            product_name text, pack_label text, price numeric);

  select jsonb_agg(jsonb_build_object(
           'name', x.product_name, 'form', x.form, 'pack_label', x.pack_label,
           'quantity', x.quantity, 'unit_price', x.price, 'subtotal', x.quantity * x.price)
         order by x.product_name, x.form)
    into v_lines
  from jsonb_to_recordset(v_priced)
       as x(product_name text, form public.item_form, pack_label text, quantity integer, price numeric);

  return jsonb_build_object('order_id', v_order_id, 'total', v_total, 'items', v_lines);
end $$;

-- ---------------------------------------------------------------------
-- RPC: ver el celular de un pedido (solo personal, con la clave del servidor)
-- ---------------------------------------------------------------------
create function public.order_phone(p_order_id uuid, p_phone_key text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare v_phone text;
begin
  if not private.is_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  select extensions.pgp_sym_decrypt(o.phone_encrypted, p_phone_key) into v_phone
  from public.orders o where o.id = p_order_id;
  return v_phone;
end $$;

-- ---------------------------------------------------------------------
-- RPC: límite de intentos por ventana de tiempo (punto 11)
-- Devuelve true si la petición está permitida.
-- ---------------------------------------------------------------------
create function public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz;
  v_hits   integer;
begin
  if p_key is null or char_length(p_key) > 200 or p_max < 1 or p_window_seconds < 1 then
    raise exception 'parámetros inválidos' using errcode = '22023';
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  -- Limpieza oportunista de ventanas viejas.
  delete from public.rate_limits where window_start < now() - interval '1 day';

  return v_hits <= p_max;
end $$;

-- Permisos de ejecución: por defecto Postgres concede EXECUTE a PUBLIC.
revoke all on function public.create_order(text, text, public.delivery_type, jsonb, text) from public, anon, authenticated;
revoke all on function public.order_phone(uuid, text) from public, anon;
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function private.touch_updated_at(), private.profiles_guard() from public;

grant execute on function public.create_order(text, text, public.delivery_type, jsonb, text) to service_role;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
grant execute on function public.order_phone(uuid, text) to authenticated;

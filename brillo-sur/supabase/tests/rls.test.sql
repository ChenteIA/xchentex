-- Pruebas de seguridad de la base de datos (puntos 4, 5, 8, 11, 13).
-- Se ejecutan con:  npm run test:db   (Postgres local)  o  supabase test db
-- Todo corre dentro de una transacción que se deshace al final.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(43);

-- ---------------------------------------------------------------------
-- Preparación (como postgres): usuarios, un producto inactivo y un pedido.
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'staff@test.local'),
  ('00000000-0000-0000-0000-0000000000c3', 'nadie@test.local');

insert into public.profiles (id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('00000000-0000-0000-0000-0000000000b2', 'staff');

insert into public.categories (id, name, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'Categoría de prueba', 99),
  ('10000000-0000-0000-0000-000000000002', 'Categoría oculta', 100);
update public.categories set active = false where id = '10000000-0000-0000-0000-000000000002';

insert into public.products (id, category_id, name, unit_price, pack_price, pack_label, active) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Prueba activa',   10.00, 100.00, 'Caja x12', true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Prueba inactiva',  5.00,   null,  null,      false),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Prueba sin caja',  7.50,   null,  null,      true),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'En categoría oculta', 3.00, null, null,    true);

-- ---------------------------------------------------------------------
-- 1. RLS activo en TODAS las tablas de public
-- ---------------------------------------------------------------------
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0, 'todas las tablas de public tienen RLS activado');

-- ---------------------------------------------------------------------
-- 2. service_role crea pedidos; el servidor recalcula precios (punto 8)
-- ---------------------------------------------------------------------
set local role service_role;

select is(
  (public.create_order('Bodega Rosita', '987654321', 'reparto',
     '[{"product_id":"20000000-0000-0000-0000-000000000001","form":"unit","quantity":3},
       {"product_id":"20000000-0000-0000-0000-000000000001","form":"pack","quantity":2,"unit_price":0.01,"total":1}]'::jsonb,
     'clave-de-prueba-de-32-caracteres-xx') ->> 'total')::numeric,
  230.00::numeric,
  'create_order ignora precios del cliente y calcula 3×10 + 2×100 = 230');

select throws_ok(
  $$ select public.create_order('Bodega', '987654321', 'reparto',
       '[{"product_id":"20000000-0000-0000-0000-000000000002","form":"unit","quantity":1}]'::jsonb,
       'clave-de-prueba-de-32-caracteres-xx') $$,
  '22023', null, 'rechaza productos inactivos');

select throws_ok(
  $$ select public.create_order('Bodega', '987654321', 'reparto',
       '[{"product_id":"20000000-0000-0000-0000-000000000004","form":"unit","quantity":1}]'::jsonb,
       'clave-de-prueba-de-32-caracteres-xx') $$,
  '22023', null, 'rechaza productos de categorías inactivas');

select throws_ok(
  $$ select public.create_order('Bodega', '987654321', 'reparto',
       '[{"product_id":"20000000-0000-0000-0000-000000000003","form":"pack","quantity":1}]'::jsonb,
       'clave-de-prueba-de-32-caracteres-xx') $$,
  '22023', null, 'rechaza "caja" en un producto que no tiene caja');

select throws_ok(
  $$ select public.create_order('Bodega', '987654321', 'reparto',
       '[{"product_id":"20000000-0000-0000-0000-000000000001","form":"unit","quantity":1000}]'::jsonb,
       'clave-de-prueba-de-32-caracteres-xx') $$,
  '22023', null, 'rechaza cantidades mayores a 999');

select throws_ok(
  $$ select public.create_order('Bodega', '987654321', 'reparto',
       '[{"product_id":"20000000-0000-0000-0000-000000000001","form":"unit","quantity":0}]'::jsonb,
       'clave-de-prueba-de-32-caracteres-xx') $$,
  '22023', null, 'rechaza cantidad cero');

select throws_ok(
  $$ select public.create_order('Bodega', '987654321', 'reparto',
       '[{"product_id":"20000000-0000-0000-0000-000000000001","form":"unit","quantity":1},
         {"product_id":"20000000-0000-0000-0000-000000000001","form":"unit","quantity":2}]'::jsonb,
       'clave-de-prueba-de-32-caracteres-xx') $$,
  '22023', null, 'rechaza ítems duplicados');

select throws_ok(
  $$ select public.create_order('Bodega', '12345', 'reparto',
       '[{"product_id":"20000000-0000-0000-0000-000000000001","form":"unit","quantity":1}]'::jsonb,
       'clave-de-prueba-de-32-caracteres-xx') $$,
  '22023', null, 'rechaza celulares que no son 9 dígitos empezando en 9');

select throws_ok(
  $$ select public.create_order('Bodega', '987654321', 'reparto',
       '[{"product_id":"99999999-0000-0000-0000-000000000000","form":"unit","quantity":1}]'::jsonb,
       'clave-de-prueba-de-32-caracteres-xx') $$,
  '22023', null, 'rechaza productos que no existen');

select throws_ok(
  $$ select public.create_order('Bodega', '987654321', 'reparto', '[]'::jsonb,
       'clave-de-prueba-de-32-caracteres-xx') $$,
  '22023', null, 'rechaza pedidos vacíos');

reset role;

-- ---------------------------------------------------------------------
-- 3. Cifrado del celular (punto 5)
-- ---------------------------------------------------------------------
select ok(
  (select position('987654321' in encode(phone_encrypted, 'escape')) = 0 from public.orders limit 1),
  'el celular no se guarda en texto plano');

select is(
  (select count(*)::int from public.order_items), 2,
  'el pedido guardó sus 2 ítems con precio copiado (snapshot)');

-- ---------------------------------------------------------------------
-- 4. Clave pública (anon): NO puede leer pedidos ni escribir productos
-- ---------------------------------------------------------------------
set local role anon;
set local "request.jwt.claims" to '{"role":"anon"}';

select throws_ok($$ select id from public.orders $$, '42501', null, 'anon no puede leer orders');
select throws_ok($$ select id from public.order_items $$, '42501', null, 'anon no puede leer order_items');
select throws_ok($$ select id from public.profiles $$, '42501', null, 'anon no puede leer profiles');
select throws_ok($$ select key from public.rate_limits $$, '42501', null, 'anon no puede leer rate_limits');
select throws_ok(
  $$ insert into public.products (category_id, name, unit_price)
     values ('10000000-0000-0000-0000-000000000001', 'Hack', 1) $$,
  '42501', null, 'anon no puede crear productos');
select throws_ok($$ update public.products set unit_price = 0.01 $$, '42501', null, 'anon no puede cambiar precios');
select throws_ok($$ delete from public.products $$, '42501', null, 'anon no puede borrar productos');
select throws_ok($$ insert into public.categories (name) values ('Hack') $$, '42501', null, 'anon no puede crear categorías');
select throws_ok(
  $$ insert into public.orders (business_name, phone_encrypted, total) values ('Hack', '\x00', 0) $$,
  '42501', null, 'anon no puede insertar pedidos directamente');
select throws_ok(
  $$ select public.create_order('Hack', '987654321', 'reparto', '[]'::jsonb, 'x') $$,
  '42501', null, 'anon no puede llamar create_order');
select throws_ok(
  $$ select public.hit_rate_limit('x', 1, 60) $$, '42501', null, 'anon no puede llamar hit_rate_limit');
select throws_ok(
  $$ select created_at from public.products $$, '42501', null, 'anon solo lee las columnas públicas del producto');

select is(
  (select count(*)::int from public.products where id in (
     '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004')),
  0, 'anon no ve productos inactivos ni de categorías inactivas');
select is(
  (select count(*)::int from public.products where id = '20000000-0000-0000-0000-000000000001'),
  1, 'anon sí ve productos activos');
select is(
  (select count(*)::int from public.categories where id = '10000000-0000-0000-0000-000000000002'),
  0, 'anon no ve categorías inactivas');

reset role;

-- ---------------------------------------------------------------------
-- 5. Usuario logueado SIN rol (registro no autorizado)
-- ---------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}';

select is_empty($$ select id from public.orders $$, 'usuario sin rol no ve pedidos');
select throws_ok(
  $$ insert into public.products (category_id, name, unit_price)
     values ('10000000-0000-0000-0000-000000000001', 'Hack', 1) $$,
  '42501', null, 'usuario sin rol no puede crear productos');
select is_empty(
  $$ update public.products set unit_price = 0.01 returning id $$,
  'usuario sin rol no puede cambiar precios');
select throws_ok(
  $$ insert into public.profiles (id, role) values ('00000000-0000-0000-0000-0000000000c3', 'owner') $$,
  '42501', null, 'usuario sin rol no puede darse un perfil de owner');
select throws_ok(
  $$ select public.order_phone((select id from public.orders limit 1), 'clave-de-prueba-de-32-caracteres-xx') $$,
  '42501', null, 'usuario sin rol no puede ver celulares');

reset role;

-- ---------------------------------------------------------------------
-- 6. Staff
-- ---------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';

select isnt_empty($$ select id from public.orders $$, 'staff ve los pedidos');
select isnt_empty(
  $$ update public.orders set status = 'despachado' returning id $$, 'staff cambia el estado del pedido');
select throws_ok(
  $$ update public.orders set total = 1 $$, '42501', null, 'staff NO puede cambiar el total de un pedido');
select is_empty(
  $$ update public.profiles set role = 'owner' where id = '00000000-0000-0000-0000-0000000000b2' returning id $$,
  'staff no puede cambiarse su propio rol');
select is(
  (select count(*)::int from public.profiles), 1, 'staff solo ve su propio perfil');
select is(
  public.order_phone((select id from public.orders limit 1), 'clave-de-prueba-de-32-caracteres-xx'),
  '987654321', 'staff puede ver el celular descifrado');
select is_empty(
  $$ delete from public.products where id = '20000000-0000-0000-0000-000000000003' returning id $$,
  'staff no puede borrar productos (solo desactivar)');

reset role;

-- ---------------------------------------------------------------------
-- 7. Owner
-- ---------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

select isnt_empty(
  $$ update public.profiles set active = false where id = '00000000-0000-0000-0000-0000000000b2' returning id $$,
  'owner puede desactivar a un staff');
select is_empty(
  $$ update public.profiles set role = 'staff' where id = '00000000-0000-0000-0000-0000000000a1' returning id $$,
  'owner no puede cambiar su propio rol');

reset role;

-- ---------------------------------------------------------------------
-- 8. Límite de intentos (punto 11)
-- ---------------------------------------------------------------------
set local role service_role;
select is(
  (select array_agg(public.hit_rate_limit('login:prueba', 5, 900)) from generate_series(1, 6)),
  array[true, true, true, true, true, false],
  'hit_rate_limit permite 5 intentos y bloquea el 6.º');
reset role;

select * from finish();
rollback;

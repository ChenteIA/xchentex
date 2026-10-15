-- Pruebas de las políticas de Storage para las fotos de productos (punto 16).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b2', 'staff@test.local'),
  ('00000000-0000-0000-0000-0000000000c3', 'nadie@test.local');
insert into public.profiles (id, role) values ('00000000-0000-0000-0000-0000000000b2', 'staff');
insert into storage.buckets (id, name) values ('otro-bucket', 'otro-bucket') on conflict do nothing;

select is(
  (select array[public::text, file_size_limit::text, array_to_string(allowed_mime_types, ',')]
   from storage.buckets where id = 'product-images'),
  array['true', '2097152', 'image/jpeg,image/png,image/webp'],
  'bucket product-images: público, 2 MB y solo JPG/PNG/WebP');

-- Anónimo
set local role anon;
set local "request.jwt.claims" to '{"role":"anon"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('product-images', 'hack.jpg') $$,
  '42501', null, 'anon no puede subir fotos');
select is_empty($$ select name from storage.objects where bucket_id = 'product-images' $$,
  'anon no puede listar el bucket');
reset role;

-- Usuario sin rol
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('product-images', 'hack.jpg') $$,
  '42501', null, 'usuario sin rol no puede subir fotos');
reset role;

-- Staff
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('product-images', 'foto.webp') $$,
  'staff puede subir fotos al bucket de productos');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('otro-bucket', 'x.jpg') $$,
  '42501', null, 'staff no puede subir a otros buckets');
select isnt_empty(
  $$ delete from storage.objects where bucket_id = 'product-images' and name = 'foto.webp' returning name $$,
  'staff puede borrar fotos de productos');
reset role;

insert into storage.objects (bucket_id, name) values ('product-images', 'otra.webp');
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}';
select is_empty(
  $$ delete from storage.objects where bucket_id = 'product-images' returning name $$,
  'usuario sin rol no puede borrar fotos');
reset role;

select * from finish();
rollback;

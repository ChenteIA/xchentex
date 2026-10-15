-- =====================================================================
-- Fotos de productos (punto 16)
-- Bucket público de solo lectura: cualquiera puede VER una foto por su URL,
-- pero nadie puede listar el bucket ni subir/cambiar/borrar sin ser personal.
-- El propio bucket limita el tamaño (2 MB) y los tipos MIME.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Sin política de SELECT para anon: el bucket no se puede listar por la API.
-- (Las URLs públicas /object/public/... no pasan por RLS.)
create policy "fotos: personal lee"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select private.is_staff()));

create policy "fotos: personal sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select private.is_staff()));

create policy "fotos: personal actualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select private.is_staff()))
  with check (bucket_id = 'product-images' and (select private.is_staff()));

create policy "fotos: personal borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select private.is_staff()));

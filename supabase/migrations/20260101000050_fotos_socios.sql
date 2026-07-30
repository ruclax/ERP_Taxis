-- ─────────────────────────────────────────────────────────────
-- 050 — Fotos de perfil de los socios (bucket público)
--
-- Las fotos de perfil no son sensibles y se muestran vía <img>, así que
-- viven en un bucket PÚBLICO (lectura sin signed URL). La escritura sí
-- se restringe a los roles que administran el padrón.
-- El campo socios.foto_url guarda la URL pública (con ?v= para cache-bust).
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos',
  'fotos',
  true,                                    -- lectura pública
  5242880,                                 -- 5 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- Lectura: pública (bucket public) — no requiere policy de SELECT.
-- Escritura: solo quienes administran el padrón.
drop policy if exists "fotos_insert" on storage.objects;
drop policy if exists "fotos_update" on storage.objects;
drop policy if exists "fotos_delete" on storage.objects;

create policy "fotos_insert" on storage.objects
  for INSERT to authenticated
  with check (
    bucket_id = 'fotos'
    and (
      private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])
      or private.user_es_admin_plataforma()
      or private.user_es_superadmin()
    )
  );

create policy "fotos_update" on storage.objects
  for UPDATE to authenticated
  using (
    bucket_id = 'fotos'
    and (
      private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])
      or private.user_es_admin_plataforma()
      or private.user_es_superadmin()
    )
  )
  with check (
    bucket_id = 'fotos'
    and (
      private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])
      or private.user_es_admin_plataforma()
      or private.user_es_superadmin()
    )
  );

create policy "fotos_delete" on storage.objects
  for DELETE to authenticated
  using (
    bucket_id = 'fotos'
    and (
      private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])
      or private.user_es_admin_plataforma()
      or private.user_es_superadmin()
    )
  );

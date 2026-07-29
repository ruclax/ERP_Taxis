-- ─────────────────────────────────────────────────────────────
-- 047 — Fase 3: Expediente Digital Centralizado
-- Repositorio de documentos digitalizados (licencias, pólizas,
-- títulos de concesión, INE, etc.) para su visualización.
--
-- Tabla polimórfica `documentos`: cada archivo cuelga de EXACTAMENTE
-- una entidad (socio, concesión, vehículo o póliza). Los bytes viven
-- en el bucket privado de Storage `expedientes`; aquí guardamos solo
-- la metadata + la ruta (storage_path).
--
-- Convención de ruta en Storage:
--   {tipo_dueno}/{dueno_id}/{documento_id}.{ext}
--   ej. socio/9f3a…/1c2b….pdf
--
-- NOTA (cláusula de exclusiones del contrato): el desarrollador
-- entrega la CAPACIDAD de subir/organizar/visualizar; la
-- digitalización física (escaneo) del archivo la realiza el cliente.
-- ─────────────────────────────────────────────────────────────

-- ── Tipos de documento del expediente ──
create type tipo_documento as enum (
  'LICENCIA',          -- Licencia de conducir
  'POLIZA',            -- Póliza de seguro
  'TITULO_CONCESION',  -- Título / concesión
  'INE',               -- Credencial de elector
  'CURP',
  'ACTA_NACIMIENTO',
  'COMP_DOMICILIO',    -- Comprobante de domicilio
  'FOTOGRAFIA',        -- Foto del socio / gafete
  'OTRO'
);

-- ── Documentos digitalizados (metadata; bytes en Storage) ──
create table documentos (
  id             uuid primary key default gen_random_uuid(),

  -- Dueño polimórfico: exactamente uno de estos debe estar presente
  socio_id       uuid references socios(id)      on delete cascade,
  concesion_id   uuid references concesiones(id) on delete cascade,
  vehiculo_id    uuid references vehiculos(id)   on delete cascade,
  poliza_id      uuid references polizas(id)     on delete cascade,

  tipo           tipo_documento not null,
  titulo         text,                    -- nombre legible ("Licencia 2026")
  storage_path   text not null unique,    -- ruta dentro del bucket `expedientes`
  nombre_original text,                   -- nombre del archivo subido
  mime           text,                    -- application/pdf, image/jpeg, …
  tamano_bytes   bigint check (tamano_bytes is null or tamano_bytes >= 0),
  vigencia       date,                    -- opcional (vencimiento del documento)
  notas          text,

  subido_por     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Regla polimórfica: el documento pertenece a UNA sola entidad
  constraint documentos_un_solo_dueno
    check (num_nonnulls(socio_id, concesion_id, vehiculo_id, poliza_id) = 1)
);

-- Índices por FK (convención del proyecto: toda FK indexada)
create index documentos_socio_idx     on documentos (socio_id)     where socio_id is not null;
create index documentos_concesion_idx on documentos (concesion_id) where concesion_id is not null;
create index documentos_vehiculo_idx  on documentos (vehiculo_id)  where vehiculo_id is not null;
create index documentos_poliza_idx    on documentos (poliza_id)    where poliza_id is not null;
create index documentos_tipo_idx      on documentos (tipo);

create trigger documentos_set_updated_at
  before update on documentos
  for each row execute function private.tg_set_updated_at();

comment on table documentos is
  'Fase 3 — Expediente Digital. Metadata de documentos digitalizados; los bytes viven en el bucket Storage `expedientes`. Dueño polimórfico (socio/concesión/vehículo/póliza), exactamente uno.';

-- ══════════════════════════════════════════════════════════
-- RLS — mismo patrón que las tablas de datos personales del
-- socio (socios_beneficiarios): lectura para cualquier miembro;
-- escritura para sec_general / sec_organizacion + admin_plataforma
-- + superadmin.
-- ══════════════════════════════════════════════════════════
alter table documentos enable row level security;

create policy "documentos_select_unified" on public."documentos"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "documentos_insert_unified" on public."documentos"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "documentos_update_unified" on public."documentos"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "documentos_delete_unified" on public."documentos"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- Storage — bucket privado `expedientes`
-- ══════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expedientes',
  'expedientes',
  false,                                  -- privado: solo vía signed URL
  15728640,                               -- 15 MB por archivo
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- Políticas sobre storage.objects, acotadas al bucket `expedientes`.
-- Mismo criterio de acceso que la tabla `documentos`.
drop policy if exists "expedientes_select" on storage.objects;
drop policy if exists "expedientes_insert" on storage.objects;
drop policy if exists "expedientes_update" on storage.objects;
drop policy if exists "expedientes_delete" on storage.objects;

create policy "expedientes_select" on storage.objects
  for SELECT to authenticated
  using (
    bucket_id = 'expedientes'
    and (
      private.user_es_miembro()
      or private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])
      or private.user_es_admin_plataforma()
      or private.user_es_superadmin()
    )
  );

create policy "expedientes_insert" on storage.objects
  for INSERT to authenticated
  with check (
    bucket_id = 'expedientes'
    and (
      private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])
      or private.user_es_admin_plataforma()
      or private.user_es_superadmin()
    )
  );

create policy "expedientes_update" on storage.objects
  for UPDATE to authenticated
  using (
    bucket_id = 'expedientes'
    and (
      private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])
      or private.user_es_admin_plataforma()
      or private.user_es_superadmin()
    )
  )
  with check (
    bucket_id = 'expedientes'
    and (
      private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])
      or private.user_es_admin_plataforma()
      or private.user_es_superadmin()
    )
  );

create policy "expedientes_delete" on storage.objects
  for DELETE to authenticated
  using (
    bucket_id = 'expedientes'
    and (
      private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])
      or private.user_es_admin_plataforma()
      or private.user_es_superadmin()
    )
  );

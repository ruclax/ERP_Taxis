-- ─────────────────────────────────────────────────────────────
-- 007 — Documentos personales del socio
-- Origen: CSV #1 (Agremiados) — campos de domicilio, contacto, beneficiarios,
--        credencial de elector y licencia de conducir
-- ─────────────────────────────────────────────────────────────

-- ── Domicilios (1:N — un socio puede haber tenido múltiples) ──
create table socios_direcciones (
  id            uuid primary key default gen_random_uuid(),
  socio_id      uuid not null references socios(id) on delete cascade,
  calle         text,
  numero_ext    text,
  numero_int    text,
  colonia       text,
  ciudad        text,
  estado        text,
  codigo_postal text,
  referencias   text,
  es_actual     boolean not null default true,
  desde         date,
  hasta         date,
  created_at    timestamptz not null default now()
);

create index socios_direcciones_socio on socios_direcciones (socio_id);
create unique index socios_direcciones_actual on socios_direcciones (socio_id) where es_actual = true;

-- ── Contactos (teléfonos, correos) ──
create table socios_contactos (
  id          uuid primary key default gen_random_uuid(),
  socio_id    uuid not null references socios(id) on delete cascade,
  tipo        text not null check (tipo in ('TEL_CEL','TEL_CASA','TEL_RECADO','CORREO','OTRO')),
  valor       text not null,
  es_principal boolean not null default false,
  notas       text,
  created_at  timestamptz not null default now()
);

create index socios_contactos_socio on socios_contactos (socio_id);
create index socios_contactos_tipo on socios_contactos (tipo);

-- ── Beneficiarios (cónyuge, herederos designados) ──
create table socios_beneficiarios (
  id            uuid primary key default gen_random_uuid(),
  socio_id      uuid not null references socios(id) on delete cascade,
  nombre        text not null,
  parentesco    text,
  telefono      text,
  direccion     text,
  porcentaje    numeric(5,2) check (porcentaje >= 0 and porcentaje <= 100),
  es_designado  boolean not null default false,  -- TRUE para designado oficial (vs solo cónyuge)
  notas         text,
  created_at    timestamptz not null default now()
);

create index socios_beneficiarios_socio on socios_beneficiarios (socio_id);

-- ── Credencial de elector ──
create table socios_credencial_elector (
  id            uuid primary key default gen_random_uuid(),
  socio_id      uuid not null unique references socios(id) on delete cascade,
  clave_elector text,
  seccion       text,
  vigencia      date,
  emision       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger sce_set_updated_at
  before update on socios_credencial_elector
  for each row execute function private.tg_set_updated_at();

-- ── Licencia de conducir (CSV #1 col LIC. DE COND, TIPO, VENCIMIENTO) ──
create table socios_licencia_conducir (
  id                uuid primary key default gen_random_uuid(),
  socio_id          uuid not null references socios(id) on delete cascade,
  numero_licencia   text,
  tipo              text,  -- A, B, C, transporte público
  fecha_emision     date,
  fecha_vencimiento date,
  observaciones     text,
  es_actual         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index slc_socio on socios_licencia_conducir (socio_id);
create unique index slc_actual on socios_licencia_conducir (socio_id) where es_actual = true;

create trigger slc_set_updated_at
  before update on socios_licencia_conducir
  for each row execute function private.tg_set_updated_at();

comment on table socios_direcciones is 'Domicilios históricos y actual del socio. CSV #1 col DIRECCIÓN.';
comment on table socios_contactos is 'Teléfonos y correos del socio (1:N). CSV #1 cols TEL. CEL., CORREO ELECTRONICO.';
comment on table socios_beneficiarios is 'Cónyuge y designados como beneficiarios. CSV #1 col BENEFICIARIO + datos.';
comment on table socios_credencial_elector is 'Credencial INE. CSV #1 cols Clave, Sección, Vigencia.';
comment on table socios_licencia_conducir is 'Licencia de conducir. CSV #1 cols LIC. DE COND., TIPO, VENCIMIENTO.';

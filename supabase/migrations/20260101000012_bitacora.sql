-- ─────────────────────────────────────────────────────────────
-- 012 — Bitácora de accidentes y siniestros
-- Origen: prototipo BITACORA_FULL + Comisión de Accidentes
-- ─────────────────────────────────────────────────────────────

create table bitacora_accidentes (
  id                  uuid primary key default gen_random_uuid(),

  -- Sujetos involucrados
  vehiculo_id         uuid references vehiculos(id) on delete set null,
  chofer_socio_id     uuid references socios(id) on delete set null,
  concesion_id        uuid references concesiones(id) on delete set null,

  -- Cuándo y dónde
  fecha               timestamptz not null,
  ubicacion           text,
  ciudad              text,

  -- Descripción del incidente
  descripcion         text not null,
  gravedad            gravedad not null default 'BAJA',
  hubo_lesionados     boolean not null default false,
  num_lesionados      int default 0 check (num_lesionados >= 0),
  hubo_fallecidos     boolean not null default false,
  num_fallecidos      int default 0 check (num_fallecidos >= 0),

  -- Aseguradora / reclamo
  aseguradora_caso    text,   -- núm. de siniestro
  ajustador           text,
  costo_estimado      numeric(12,2),
  costo_real          numeric(12,2),
  liquidado           boolean not null default false,
  fecha_liquidacion   date,

  -- Estado del caso
  estado              text not null default 'REPORTADO',  -- REPORTADO, EN_ATENCION, REPARADO, CERRADO

  -- Atención por la Comisión de Accidentes y Siniestros
  comision_atendio    boolean not null default false,
  responsable_socio_id uuid references socios(id) on delete set null,

  -- Adjuntos
  parte_oficial_url   text,
  fotos_urls          jsonb default '[]'::jsonb,

  observaciones       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index ba_vehiculo on bitacora_accidentes (vehiculo_id);
create index ba_chofer on bitacora_accidentes (chofer_socio_id);
create index ba_fecha on bitacora_accidentes (fecha);
create index ba_gravedad on bitacora_accidentes (gravedad);
create index ba_estado on bitacora_accidentes (estado);

create trigger ba_set_updated_at
  before update on bitacora_accidentes
  for each row execute function private.tg_set_updated_at();

comment on table bitacora_accidentes is 'Registro de accidentes vehiculares atendidos por la Comisión de Accidentes y Siniestros del sindicato.';

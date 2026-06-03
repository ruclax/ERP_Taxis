-- ─────────────────────────────────────────────────────────────
-- 014 — Honor y Justicia: casos disciplinarios y audiencias
-- Regla: plazo máximo de 15 días para dictamen (estatuto sindical)
-- ─────────────────────────────────────────────────────────────

create table casos_honor_justicia (
  id                      uuid primary key default gen_random_uuid(),
  numero_caso             text not null unique,         -- HYJ-2026-001
  socio_consignado_id     uuid not null references socios(id) on delete restrict,
  consignado_por_user_id  uuid references auth.users(id) on delete set null,
  consignado_por_socio_id uuid references socios(id) on delete set null,
  origen_modulo           text,   -- ej. 'BITACORA', 'PADRON', 'EXPEDIENTE' — de dónde se consignó

  motivo                  text not null,
  hechos                  text,
  evidencia_url           text,

  fecha_recibido          date not null,
  -- Plazo máximo: 15 días desde fecha_recibido
  fecha_dictamen_max      date generated always as (fecha_recibido + 15) stored,
  fecha_dictamen          date,
  dictamen                text,
  estado                  caso_estado not null default 'RECIBIDO',
  sancion_aplicada        text,
  cerrado_at              timestamptz,
  archivado_at            timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- Restricción: el dictamen no puede emitirse antes de la consignación
  constraint hyj_fecha_dictamen_check check (fecha_dictamen is null or fecha_dictamen >= fecha_recibido)
);

create index hyj_consignado on casos_honor_justicia (socio_consignado_id);
create index hyj_estado on casos_honor_justicia (estado);
create index hyj_vence on casos_honor_justicia (fecha_dictamen_max) where estado <> 'CERRADO' and estado <> 'ARCHIVADO';

create trigger hyj_set_updated_at
  before update on casos_honor_justicia
  for each row execute function private.tg_set_updated_at();

-- ── Audiencias del caso ──
create table audiencias (
  id              uuid primary key default gen_random_uuid(),
  caso_id         uuid not null references casos_honor_justicia(id) on delete cascade,
  fecha           timestamptz not null,
  lugar           text,
  citados         jsonb default '[]'::jsonb,  -- arreglo de {socio_id, rol: 'ACUSADO'|'ACUSADOR'|'TESTIGO'}
  resultado       text,
  acta_url        text,
  hubo_careo      boolean not null default false,
  notas           text,
  created_at      timestamptz not null default now()
);

create index audiencias_caso on audiencias (caso_id);
create index audiencias_fecha on audiencias (fecha);

comment on table casos_honor_justicia is 'Casos consignados a la Comisión de Honor y Justicia. Estatuto: dictamen en máximo 15 días.';
comment on column casos_honor_justicia.fecha_dictamen_max is 'Fecha límite calculada (recibido + 15 días). Indica plazo legal del dictamen.';
comment on table audiencias is 'Audiencias / diligencias del caso. Pueden incluir careos entre acusados y acusadores.';

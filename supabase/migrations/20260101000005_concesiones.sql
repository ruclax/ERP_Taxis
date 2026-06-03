-- ─────────────────────────────────────────────────────────────
-- 005 — Concesiones (núcleo del sistema — llave 27P-0325)
-- Origen: CSV #2 + CSV #3 + CSV #4 + CSV #7
-- ─────────────────────────────────────────────────────────────

create table concesiones (
  id                  uuid primary key default gen_random_uuid(),

  -- Número de concesión oficial (formato 27P-0325)
  numero_concesion    text not null unique,

  -- Concesionario titular
  socio_id            uuid not null references socios(id) on delete restrict,

  -- Ubicación operativa
  sitio_id            uuid references sitios(id) on delete set null,
  taxi_numero         int,  -- Número interno del sitio (CSV #4 col No.)

  -- Datos legales
  tipo                concesion_tipo not null default 'CONCESION',
  estado              concesion_estado not null default 'VIGENTE',
  fecha_concesion     date,
  fecha_acuerdo       date,
  modalidad           text,           -- ej. "Taxi"
  submodalidad        text,           -- ej. "Sitio", "Ruleteo"
  ruta_denominada     text,
  cesion_sucesion     text,           -- Notas legales de cesión o sucesión
  fecha_baja          date,
  motivo_baja         text,

  -- Independientes (CSV #7) — NO afiliados al sindicato
  es_independiente    boolean not null default false,

  -- Auditoría
  comentarios         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index concesiones_numero_trgm on concesiones using gin (numero_concesion gin_trgm_ops);
create index concesiones_socio on concesiones (socio_id);
create index concesiones_sitio on concesiones (sitio_id);
create index concesiones_estado on concesiones (estado);
create index concesiones_independiente on concesiones (es_independiente);

create trigger concesiones_set_updated_at
  before update on concesiones
  for each row execute function private.tg_set_updated_at();

-- Restricción: el número de taxi debe ser único dentro de cada sitio cuando ambos están definidos
create unique index concesiones_sitio_taxi_unique
  on concesiones (sitio_id, taxi_numero)
  where sitio_id is not null and taxi_numero is not null;

comment on table concesiones is 'Permisos/concesiones de operación. Llave de negocio: numero_concesion (formato 27P-0325). Cada socio puede tener múltiples concesiones.';
comment on column concesiones.taxi_numero is 'Número interno asignado dentro del sitio (CSV #4 col No., CSV #1 col NUM. CARRO).';
comment on column concesiones.es_independiente is 'TRUE cuando proviene del CSV #7 — operador no afiliado al sindicato.';

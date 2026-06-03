-- ─────────────────────────────────────────────────────────────
-- 011 — Paquete funerario (Plan A y Plan B)
-- ─────────────────────────────────────────────────────────────

create table funerario_planes_catalogo (
  codigo            text primary key,           -- 'PLAN_A', 'PLAN_B'
  nombre            text not null,
  monto_mensual     numeric(10,2) not null,
  descripcion       text,
  beneficios        jsonb not null default '[]',  -- lista de coberturas
  activo            boolean not null default true,
  created_at        timestamptz not null default now()
);

-- Inscripciones de socios al paquete funerario
create table funerario_inscripciones (
  id                uuid primary key default gen_random_uuid(),
  socio_id          uuid not null references socios(id) on delete cascade,
  plan_codigo       text not null references funerario_planes_catalogo(codigo) on delete restrict,
  monto_mensual     numeric(10,2) not null,
  fecha_alta        date not null,
  fecha_baja        date,
  motivo_baja       text,
  activa            boolean not null default true,
  notas             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Un socio solo puede tener una inscripción activa a la vez
  exclude using gist (
    socio_id with =,
    daterange(fecha_alta, coalesce(fecha_baja, 'infinity'::date), '[]') with &&
  ) where (activa = true)
);

create index fi_socio on funerario_inscripciones (socio_id);
create index fi_plan on funerario_inscripciones (plan_codigo);
create index fi_activa on funerario_inscripciones (socio_id) where activa = true;

create trigger fi_set_updated_at
  before update on funerario_inscripciones
  for each row execute function private.tg_set_updated_at();

-- Servicios funerarios prestados
create table funerario_servicios (
  id                  uuid primary key default gen_random_uuid(),
  socio_titular_id    uuid not null references socios(id) on delete restrict,
  plan_codigo         text references funerario_planes_catalogo(codigo) on delete set null,

  beneficiario_nombre text not null,
  parentesco          text,
  fecha_servicio      date not null,
  funeraria           text,
  costo_total         numeric(12,2) check (costo_total >= 0),
  costo_cubierto      numeric(12,2) check (costo_cubierto >= 0),
  costo_excedente     numeric(12,2),
  acta_defuncion_url  text,
  observaciones       text,
  created_at          timestamptz not null default now()
);

create index fs_titular on funerario_servicios (socio_titular_id);
create index fs_fecha on funerario_servicios (fecha_servicio);

-- Seed del catálogo (dos planes que vienen del prototipo)
insert into funerario_planes_catalogo (codigo, nombre, monto_mensual, descripcion, beneficios) values
  ('PLAN_A', 'Plan A', 180.00, 'Cobertura completa', '["Servicio funerario completo", "Capilla", "Carroza", "Cremación incluida", "Asistencia 24/7"]'::jsonb),
  ('PLAN_B', 'Plan B', 90.00,  'Cobertura básica',   '["Servicio funerario básico", "Capilla", "Carroza"]'::jsonb);

comment on table funerario_planes_catalogo is 'Catálogo de planes (Plan A $180, Plan B $90 — del prototipo).';
comment on table funerario_inscripciones is 'Socios inscritos al paquete funerario. Solo una inscripción activa por socio.';
comment on table funerario_servicios is 'Servicios prestados. El beneficiario puede ser el titular o un familiar.';

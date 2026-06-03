-- ─────────────────────────────────────────────────────────────
-- 006 — Vehículos, asignaciones a concesión y pólizas
-- Origen: CSV #3 + CSV #4 + CSV #7
-- ─────────────────────────────────────────────────────────────

create table vehiculos (
  id                    uuid primary key default gen_random_uuid(),

  -- Identificación física
  placas                text unique,
  numero_serie          text unique,        -- VIN
  numero_motor          text,

  -- Datos del vehículo
  marca                 text,
  modelo                text,
  anio                  int check (anio between 1950 and 2099),
  color                 text,
  engomado              text,

  -- Concesión actual (snapshot — el historial está en vehiculo_asignaciones)
  concesion_actual_id   uuid references concesiones(id) on delete set null,

  -- Estatus operativo
  estatus               vehiculo_estatus not null default 'ACTIVO',
  fecha_alta            date,
  fecha_baja            date,
  motivo_baja           text,

  -- Vehículos de independientes (CSV #7)
  es_independiente      boolean not null default false,

  -- Notas
  comentarios           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index vehiculos_placas on vehiculos (placas);
create index vehiculos_serie on vehiculos (numero_serie);
create index vehiculos_concesion on vehiculos (concesion_actual_id);
create index vehiculos_estatus on vehiculos (estatus);
create index vehiculos_anio on vehiculos (anio);

create trigger vehiculos_set_updated_at
  before update on vehiculos
  for each row execute function private.tg_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Historial de asignaciones vehículo ↔ concesión
-- ─────────────────────────────────────────────────────────────

create table vehiculo_asignaciones (
  id              uuid primary key default gen_random_uuid(),
  vehiculo_id     uuid not null references vehiculos(id) on delete cascade,
  concesion_id    uuid not null references concesiones(id) on delete cascade,
  fecha_inicio    date not null,
  fecha_fin       date,
  motivo_cambio   text,
  created_at      timestamptz not null default now()
);

create index veh_asig_vehiculo on vehiculo_asignaciones (vehiculo_id);
create index veh_asig_concesion on vehiculo_asignaciones (concesion_id);
create index veh_asig_activa on vehiculo_asignaciones (vehiculo_id) where fecha_fin is null;

-- ─────────────────────────────────────────────────────────────
-- Pólizas (CSV #3)
-- ─────────────────────────────────────────────────────────────

create table polizas (
  id                  uuid primary key default gen_random_uuid(),
  vehiculo_id         uuid not null references vehiculos(id) on delete cascade,

  numero_poliza       text not null,
  compania            text not null,
  costo               numeric(10,2) check (costo >= 0),

  fecha_inicio        date,
  fecha_vencimiento   date not null,
  endoso              text,

  estado              poliza_estado not null default 'VIGENTE',
  comentarios         text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (vehiculo_id, numero_poliza, fecha_inicio)
);

create index polizas_vehiculo on polizas (vehiculo_id);
create index polizas_vencimiento on polizas (fecha_vencimiento);
create index polizas_estado on polizas (estado);

create trigger polizas_set_updated_at
  before update on polizas
  for each row execute function private.tg_set_updated_at();

-- Vista útil: póliza vigente actual por vehículo + días restantes
create or replace view v_polizas_actuales as
select
  p.*,
  (p.fecha_vencimiento - current_date) as dias_restantes,
  case
    when p.fecha_vencimiento < current_date then 'VENCIDA'
    when p.fecha_vencimiento - current_date <= 30 then 'POR_VENCER'
    else 'VIGENTE'
  end as estado_calculado
from polizas p
where p.estado <> 'CANCELADA'
  and p.fecha_vencimiento = (
    select max(p2.fecha_vencimiento) from polizas p2
    where p2.vehiculo_id = p.vehiculo_id and p2.estado <> 'CANCELADA'
  );

comment on table vehiculos is 'Unidades vehiculares — taxis del sindicato e independientes. Origen: CSV #3 (Vehículos y Pólizas), CSV #4 (por sitio), CSV #7 (Independientes).';
comment on table vehiculo_asignaciones is 'Historial de qué vehículo operó cada concesión. Permite rastrear cuándo se cambió de vehículo manteniendo la concesión.';
comment on table polizas is 'Pólizas de seguro. CSV #3 cols Poliza, Compañía, Vencimiento, Costo, Endoso, Comentarios.';

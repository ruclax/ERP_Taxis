-- ─────────────────────────────────────────────────────────────
-- 016 — Mensualidades / cuotas y vehículos fuera del sindicato
-- Origen: requisito de Daniel.docx (padrón de mensualidades + fuera de sindicato)
-- ─────────────────────────────────────────────────────────────

-- ── Catálogo de tipos de cuota ──
create table cuotas_catalogo (
  codigo            text primary key,           -- 'CUOTA_MENSUAL', 'EXTRAORDINARIA', etc.
  nombre            text not null,
  monto             numeric(10,2) not null,
  recurrencia       text not null,              -- MENSUAL, UNICA, ANUAL
  activa            boolean not null default true,
  descripcion       text,
  created_at        timestamptz not null default now()
);

-- ── Pagos mensuales por sitio ──
-- Reto del documento: choferes cambian de sitio (ej. enero=puente, febrero=central)
-- Por eso la cuota registra el sitio_id_donde_pago, no necesariamente el sitio actual del socio.
create table mensualidades_cuotas (
  id                    uuid primary key default gen_random_uuid(),
  socio_id              uuid not null references socios(id) on delete cascade,
  concesion_id          uuid references concesiones(id) on delete set null,
  sitio_id_donde_pago   uuid not null references sitios(id) on delete restrict,
  cuota_codigo          text not null references cuotas_catalogo(codigo) on delete restrict,

  periodo               date not null,          -- primer día del mes que cubre la cuota
  monto                 numeric(10,2) not null check (monto >= 0),
  fecha_pago            timestamptz,
  estatus               pago_estatus not null default 'PENDIENTE',

  movimiento_id         uuid references tesoreria_movimientos(id) on delete set null,
  recibo_url            text,
  cobrado_por_user_id   uuid references auth.users(id) on delete set null,
  notas                 text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (socio_id, cuota_codigo, periodo)
);

create index mc_socio on mensualidades_cuotas (socio_id);
create index mc_sitio on mensualidades_cuotas (sitio_id_donde_pago);
create index mc_periodo on mensualidades_cuotas (periodo);
create index mc_estatus on mensualidades_cuotas (estatus);
create index mc_pendientes on mensualidades_cuotas (socio_id, periodo) where estatus = 'PENDIENTE';

create trigger mc_set_updated_at
  before update on mensualidades_cuotas
  for each row execute function private.tg_set_updated_at();

-- ── Vehículos fuera del sindicato (histórico) ──
-- Daniel.docx: "registro de vehículos que ya no pertenecen, sin datos actualizados"
-- Mantenemos como vista filtrada de vehiculos + tabla complementaria para notas
create table vehiculos_fuera_sindicato_notas (
  id              uuid primary key default gen_random_uuid(),
  vehiculo_id     uuid not null unique references vehiculos(id) on delete cascade,
  fecha_salida    date,
  motivo_salida   text,
  ultimo_titular  text,
  ultima_observacion text,
  documentos_url  jsonb default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger vfsn_set_updated_at
  before update on vehiculos_fuera_sindicato_notas
  for each row execute function private.tg_set_updated_at();

-- Seed básico del catálogo
insert into cuotas_catalogo (codigo, nombre, monto, recurrencia, descripcion) values
  ('CUOTA_MENSUAL', 'Cuota sindical mensual', 100.00, 'MENSUAL', 'Aportación sindical ordinaria'),
  ('FUNERARIO_A',   'Plan funerario A',       180.00, 'MENSUAL', 'Inscripción al Plan A'),
  ('FUNERARIO_B',   'Plan funerario B',        90.00, 'MENSUAL', 'Inscripción al Plan B'),
  ('EXTRAORDINARIA','Cuota extraordinaria',   500.00, 'UNICA',   'Aportación extraordinaria autorizada por asamblea');

comment on table cuotas_catalogo is 'Catálogo maestro de cuotas y aportaciones.';
comment on table mensualidades_cuotas is 'Pagos mensuales de cuotas. Registra el SITIO DONDE SE PAGÓ (puede diferir del sitio actual del socio).';
comment on table vehiculos_fuera_sindicato_notas is 'Notas adicionales para vehículos con estatus FUERA_SINDICATO. La info principal vive en vehiculos.';

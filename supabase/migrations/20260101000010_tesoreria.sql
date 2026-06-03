-- ─────────────────────────────────────────────────────────────
-- 010 — Tesorería: movimientos, cortes de caja, adeudos
-- ─────────────────────────────────────────────────────────────

-- ── Cortes de caja mensuales ──
create table tesoreria_cortes_caja (
  id                      uuid primary key default gen_random_uuid(),
  periodo                 date not null,  -- primer día del mes
  total_ingresos          numeric(12,2) not null default 0,
  total_egresos           numeric(12,2) not null default 0,
  saldo_inicial           numeric(12,2) not null default 0,
  saldo_final             numeric(12,2) generated always as (saldo_inicial + total_ingresos - total_egresos) stored,

  cerrado_at              timestamptz,
  cerrado_por_user_id     uuid references auth.users(id) on delete set null,
  autorizado_at           timestamptz,
  autorizado_por_user_id  uuid references auth.users(id) on delete set null,
  observaciones_hacienda  text,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  unique (periodo)
);

create trigger ccc_set_updated_at
  before update on tesoreria_cortes_caja
  for each row execute function private.tg_set_updated_at();

-- ── Movimientos contables ──
create table tesoreria_movimientos (
  id              uuid primary key default gen_random_uuid(),
  tipo            movimiento_tipo not null,
  concepto        text not null,
  monto           numeric(12,2) not null check (monto >= 0),
  fecha           date not null,
  socio_id        uuid references socios(id) on delete set null,
  referencia      text,         -- folio de recibo o comprobante
  cuenta          text,         -- catálogo de cuotas (ej. CUOTA_MENSUAL, FUNERARIO_A)
  corte_caja_id   uuid references tesoreria_cortes_caja(id) on delete set null,
  comprobante_url text,         -- Supabase Storage
  notas           text,
  created_at      timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id) on delete set null
);

create index tm_tipo on tesoreria_movimientos (tipo);
create index tm_fecha on tesoreria_movimientos (fecha);
create index tm_socio on tesoreria_movimientos (socio_id);
create index tm_corte on tesoreria_movimientos (corte_caja_id);
create index tm_cuenta on tesoreria_movimientos (cuenta);

-- ── Adeudos (lo que un socio debe al sindicato) ──
create table adeudos (
  id                uuid primary key default gen_random_uuid(),
  socio_id          uuid not null references socios(id) on delete cascade,
  tipo              text not null,             -- CUOTA, MULTA, FUNERARIO, OTRO
  concepto          text not null,
  monto_original    numeric(12,2) not null check (monto_original >= 0),
  monto_pendiente   numeric(12,2) not null check (monto_pendiente >= 0),
  fecha_origen      date not null,
  fecha_vencimiento date,
  estatus           pago_estatus not null default 'PENDIENTE',
  notas             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index adeudos_socio on adeudos (socio_id);
create index adeudos_estatus on adeudos (estatus);
create index adeudos_pendiente on adeudos (socio_id) where estatus = 'PENDIENTE';

create trigger adeudos_set_updated_at
  before update on adeudos
  for each row execute function private.tg_set_updated_at();

comment on table tesoreria_cortes_caja is 'Cortes de caja mensuales. Cerrado por el Tesorero y autorizado por el Secretario General. La Comisión de Hacienda audita.';
comment on table tesoreria_movimientos is 'Movimientos contables individuales (ingresos/egresos). Cada movimiento puede asociarse a un corte mensual y a un socio.';
comment on table adeudos is 'Deudas pendientes de cada socio. Mantiene monto original y pendiente para histórico de pagos parciales.';

-- ─────────────────────────────────────────────────────────────
-- 008 — Antidoping y revistas vehiculares
-- Origen: CSV #6 (Antidoping), CSV #3 (Revistas implícitas)
-- ─────────────────────────────────────────────────────────────

-- ── Pruebas antidoping ──
create table antidoping (
  id              uuid primary key default gen_random_uuid(),
  socio_id        uuid not null references socios(id) on delete cascade,
  concesion_id    uuid references concesiones(id) on delete set null,

  fecha_prueba    date not null,
  fecha_vencimiento date,  -- antiguedad + duración del certificado
  resultado       text,    -- NEGATIVO, POSITIVO, NO_PRESENTADO
  hoja            text,    -- Núm. de hoja de control (CSV #6 col Hoja)
  banco           text,    -- Comprobante de pago (CSV #6 col Banco)
  antiguedad_meses int,    -- CSV #6 col Ant.
  laboratorio     text,
  observaciones   text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index antidoping_socio on antidoping (socio_id);
create index antidoping_concesion on antidoping (concesion_id);
create index antidoping_vencimiento on antidoping (fecha_vencimiento);
create unique index antidoping_socio_fecha_unique on antidoping (socio_id, fecha_prueba);

create trigger antidoping_set_updated_at
  before update on antidoping
  for each row execute function private.tg_set_updated_at();

-- ── Revistas mecánicas y documentales (CSV #3 menciona ambas) ──
create table revistas_vehiculares (
  id                uuid primary key default gen_random_uuid(),
  vehiculo_id       uuid not null references vehiculos(id) on delete cascade,
  tipo              revista_tipo not null,
  fecha_practicada  date not null,
  fecha_vencimiento date,
  prorroga_hasta    date,
  resultado         text,  -- APROBADO, RECHAZADO, CONDICIONAL
  ficha_pago        text,  -- Folio de pago de la revista
  observaciones     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index revistas_vehiculo on revistas_vehiculares (vehiculo_id);
create index revistas_tipo on revistas_vehiculares (tipo);
create index revistas_vencimiento on revistas_vehiculares (fecha_vencimiento);

create trigger revistas_set_updated_at
  before update on revistas_vehiculares
  for each row execute function private.tg_set_updated_at();

comment on table antidoping is 'Pruebas antidoping para licencia de transporte público. CSV #6.';
comment on column antidoping.banco is 'Referencia bancaria del pago del trámite. CSV #6 col Banco.';
comment on table revistas_vehiculares is 'Revistas documentales y mecánicas obligatorias. CSV #3 menciona Revista Documental/Mecánica + ficha de pago + prórroga.';

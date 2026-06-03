-- ─────────────────────────────────────────────────────────────
-- 013 — Asambleas, Actas y Acuerdos
-- Responsable: Secretario de Actas y Acuerdos
-- ─────────────────────────────────────────────────────────────

create table asambleas (
  id                    uuid primary key default gen_random_uuid(),
  tipo                  asamblea_tipo not null,
  fecha                 timestamptz not null,
  lugar                 text,
  orden_del_dia         text,
  convocatoria_url      text,
  convocatoria_firmada_at timestamptz,
  convocatoria_firmada_por_user_id uuid references auth.users(id) on delete set null,
  acta_firmada_at       timestamptz,
  acta_firmada_por_user_id uuid references auth.users(id) on delete set null,
  asistentes_total      int,
  quorum_alcanzado      boolean,
  observaciones         text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index asambleas_fecha on asambleas (fecha);
create index asambleas_tipo on asambleas (tipo);

create trigger asambleas_set_updated_at
  before update on asambleas
  for each row execute function private.tg_set_updated_at();

-- ── Libro de actas ──
create table actas (
  id            uuid primary key default gen_random_uuid(),
  asamblea_id   uuid references asambleas(id) on delete restrict,
  folio         text not null unique,         -- folio del libro de actas
  fecha         date not null,
  asunto        text not null,
  contenido     text,                          -- transcripción libre
  acta_url      text,                          -- documento escaneado
  firmas_total  int default 0,
  firmas_completas boolean not null default false,
  estado        text not null default 'BORRADOR',  -- BORRADOR, FIRMADA, ARCHIVADA
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index actas_asamblea on actas (asamblea_id);
create index actas_fecha on actas (fecha);
create index actas_estado on actas (estado);

create trigger actas_set_updated_at
  before update on actas
  for each row execute function private.tg_set_updated_at();

-- ── Acuerdos derivados de las asambleas ──
create table acuerdos (
  id                  uuid primary key default gen_random_uuid(),
  numero              text not null unique,         -- ACU-2026-001
  asamblea_id         uuid references asambleas(id) on delete set null,
  acta_id             uuid references actas(id) on delete set null,
  descripcion         text not null,
  responsable_socio_id uuid references socios(id) on delete set null,
  plazo_dias          int,
  fecha_compromiso    date,
  fecha_cumplimiento  date,
  estado              acuerdo_estado not null default 'PENDIENTE',
  evidencia_url       text,
  observaciones       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index acuerdos_asamblea on acuerdos (asamblea_id);
create index acuerdos_responsable on acuerdos (responsable_socio_id);
create index acuerdos_estado on acuerdos (estado);

create trigger acuerdos_set_updated_at
  before update on acuerdos
  for each row execute function private.tg_set_updated_at();

comment on table asambleas is 'Asambleas ordinarias, extraordinarias y de comité ejecutivo. Conv./acta firma del Sec. General y del Sec. de Actas.';
comment on table actas is 'Libro de actas con folio. CFCRL puede requerir depósito de algunas.';
comment on table acuerdos is 'Acuerdos derivados de cada asamblea con responsable y plazo.';

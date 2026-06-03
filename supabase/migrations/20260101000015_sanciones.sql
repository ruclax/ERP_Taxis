-- ─────────────────────────────────────────────────────────────
-- 015 — Sanciones de sitio (delegados, máx 3 días)
-- Origen: Roles y Responsabilidades.docx (delegado puede sancionar hasta 3 días)
-- ─────────────────────────────────────────────────────────────

create table sanciones_sitio (
  id                      uuid primary key default gen_random_uuid(),
  socio_sancionado_id     uuid not null references socios(id) on delete cascade,
  sitio_id                uuid not null references sitios(id) on delete restrict,
  delegado_socio_id       uuid not null references socios(id) on delete restrict,

  fecha                   date not null,
  motivo                  text not null,
  dias_sancion            int not null check (dias_sancion between 1 and 3),
  fecha_inicio_castigo    date,
  fecha_fin_castigo       date,
  cumplida                boolean not null default false,
  inconforme              boolean not null default false,
  fecha_inconformidad     date,
  resuelta_por            text,         -- referencia a caso HyJ si escaló

  notas                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index ss_socio on sanciones_sitio (socio_sancionado_id);
create index ss_sitio on sanciones_sitio (sitio_id);
create index ss_delegado on sanciones_sitio (delegado_socio_id);
create index ss_fecha on sanciones_sitio (fecha);
create index ss_cumplida on sanciones_sitio (cumplida);

create trigger ss_set_updated_at
  before update on sanciones_sitio
  for each row execute function private.tg_set_updated_at();

comment on table sanciones_sitio is 'Sanciones internas aplicadas por delegados/jefes de sitio. Por reglamento, máx 3 días. Si el socio se inconforma, escala a Honor y Justicia.';

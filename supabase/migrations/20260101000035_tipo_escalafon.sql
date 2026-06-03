-- ─────────────────────────────────────────────────────────────
-- 035 — Modelar las DOS listas paralelas del padrón sindical:
--   1) CONCESIONARIO — orden de antigüedad de quienes poseen concesión (1..N)
--   2) ASPIRANTE     — lista de espera/pretendientes para concesión vacante (1..M)
--   3) NINGUNO       — no está en ninguna lista (default)
--
-- El #escalafon puede repetirse entre listas (CONCESIONARIO #5 ≠ ASPIRANTE #5),
-- pero no dentro de la misma. UNIQUE compuesto lo garantiza.
-- ─────────────────────────────────────────────────────────────

create type tipo_escalafon as enum (
  'CONCESIONARIO',
  'ASPIRANTE',
  'NINGUNO'
);

alter table public.socios
  add column tipo_escalafon tipo_escalafon not null default 'NINGUNO';

-- Backfill: los 122 socios que ya tienen escalafon_numero son concesionarios
-- (vinieron del CSV de Escalafón con su número de concesión).
update public.socios
  set tipo_escalafon = 'CONCESIONARIO'
  where escalafon_numero is not null;

-- Quitar el UNIQUE simple anterior (no permitía repetir 5 en aspirantes)
alter table public.socios
  drop constraint if exists socios_escalafon_numero_key;

-- Nuevo UNIQUE compuesto: el mismo número puede existir en distintos tipos
create unique index socios_escalafon_tipo_unique
  on public.socios (tipo_escalafon, escalafon_numero)
  where escalafon_numero is not null and tipo_escalafon != 'NINGUNO';

-- Mejor índice de búsqueda
drop index if exists socios_escalafon;
create index socios_escalafon
  on public.socios (tipo_escalafon, escalafon_numero)
  where escalafon_numero is not null;

comment on column public.socios.tipo_escalafon is
  'Qué lista del padrón sindical: CONCESIONARIO (con concesión), ASPIRANTE (lista de espera para concesión vacante), o NINGUNO. Su número vive en escalafon_numero.';

-- ─────────────────────────────────────────────────────────────
-- 040 — Columna `socios.tipo_padron`: clasificación formal del socio
-- según el CSV oficial "1.- Padrón de Agremiados 2026".
--
-- Distinto de `socios.tipo_socio` (que fue inferido al importar). El
-- tipo del padrón es el marcador formal que usa el sindicato:
--
--   • CONCESIONARIO  → titular formal de concesión (con o sin vigencia)
--   • TRANSITORIO    → opera temporalmente, sin titularidad permanente
--   • CUOTA_25       → cuota especial del 25% (categoría histórica)
--   • NULL           → sin clasificación en el padrón oficial
--
-- Se distingue de "tiene concesión vigente" (calculable via JOIN):
-- alguien puede ser CONCESIONARIO en el padrón pero su concesión
-- estar en BAJA, o ser TRANSITORIO con concesión vigente prestada.
-- ─────────────────────────────────────────────────────────────

create type tipo_padron as enum (
  'CONCESIONARIO',
  'TRANSITORIO',
  'CUOTA_25'
);

alter table public.socios
  add column tipo_padron tipo_padron;

comment on column public.socios.tipo_padron is
  'Clasificación formal del socio en el padrón oficial del sindicato (CSV #1, columna TIPO DE SOCIO). Distinto de tipo_socio que fue inferido al importar. Null = sin clasificación.';

create index socios_tipo_padron
  on public.socios (tipo_padron)
  where tipo_padron is not null;

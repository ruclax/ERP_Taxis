-- ─────────────────────────────────────────────────────────────
-- 032 — Agregar columna `ocupacion` a socios.
-- Se puebla desde el CSV `1.- Padron de Agremiados 2026.csv`
-- y se usa para inferir si el titular maneja su propia unidad.
-- ─────────────────────────────────────────────────────────────

alter table public.socios
  add column if not exists ocupacion text;

comment on column public.socios.ocupacion is
  'CSV #1 col OCUPACION. Texto libre del padrón (CHOFER, HOGAR, CASA, AGENCIA, etc.). Sin normalizar — uso interno para inferir rol laboral del titular.';

-- Índice parcial para acelerar el filtro estricto que usa
-- `marcar-titular-chofer-por-ocupacion.ts`.
create index if not exists socios_ocupacion_chofer
  on public.socios (id)
  where upper(trim(ocupacion)) = 'CHOFER';

-- ─────────────────────────────────────────────────────────────
-- 028 — Convertir socios.firma_actual a boolean.
--   true  = firma recabada
--   false = pendiente (o no recabada)
-- Las notas que existían en la columna fueron movidas a `comentarios`
-- por el script `fix-firma-from-xlsx.mjs` antes de aplicar esta migración.
-- ─────────────────────────────────────────────────────────────

alter table public.socios
  alter column firma_actual drop default;

alter table public.socios
  alter column firma_actual type boolean
  using case
    when firma_actual::text = 'RECABADA' then true
    when firma_actual::text in ('PENDIENTE', 'NO_APLICA') then false
    else false
  end;

alter table public.socios
  alter column firma_actual set default false;

alter table public.socios
  alter column firma_actual set not null;

comment on column public.socios.firma_actual is
  'Boolean: true=firma recabada, false=pendiente. Notas relacionadas viven en comentarios.';

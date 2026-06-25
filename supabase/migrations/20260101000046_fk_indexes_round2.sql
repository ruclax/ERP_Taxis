-- ─────────────────────────────────────────────────────────────
-- 046 — Índices FK que se me pasaron en la migración 042.
-- Cierra los 2 INFO restantes de `unindexed_foreign_keys`.
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_mens_cuota_codigo
  on public.mensualidades_cuotas (cuota_codigo);

create index if not exists idx_usuarios_roles_scope_sitio
  on public.usuarios_roles (scope_sitio_id);

-- Nota sobre los ~70 hints de `unused_index`:
--   - Son falsos positivos en este punto del proyecto.
--   - La mayoría son índices sobre tablas vacías (módulos placeholder)
--     o índices recién creados en 042 sin tráfico aún.
--   - Costo de mantener un índice no usado: bajo (espacio + insert).
--   - Costo de borrarlo y necesitarlo: alto (queries lentas en prod).
--   - Re-evaluar en 30-60 días con tráfico real.

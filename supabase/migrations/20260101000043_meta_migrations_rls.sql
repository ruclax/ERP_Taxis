-- ─────────────────────────────────────────────────────────────
-- 043 — Habilitar RLS en `_meta_migrations` (tracking interno).
--
-- Esta tabla la usa `scripts/migrate.ts` para saber qué migraciones
-- ya se aplicaron. Vive en schema public por convención de Supabase
-- (PostgREST solo expone public). Sin RLS, queda visible a cualquier
-- usuario autenticado vía REST API.
--
-- Solución: habilitar RLS sin políticas. Eso bloquea todo acceso vía
-- PostgREST. Los scripts admin siguen funcionando porque usan el
-- service_role key que bypasea RLS.
-- ─────────────────────────────────────────────────────────────

alter table public._meta_migrations enable row level security;

comment on table public._meta_migrations is
  'Tracking interno de migraciones aplicadas. RLS habilitada sin políticas — solo accesible vía service_role (scripts admin).';

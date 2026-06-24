-- ─────────────────────────────────────────────────────────────
-- 044 — Cierre de warnings restantes del Supabase Advisor:
--   • 3 funciones internas (triggers + helper) sin search_path fijo
--   • 2 extensiones (pg_trgm, btree_gist) en schema public
--
-- Nota: `auth_leaked_password_protection` NO se cambia con SQL —
-- es un toggle del dashboard de Supabase Auth (ver instrucciones
-- al final).
-- ─────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════
-- 1) Funciones faltantes (las olvidé en 042)
-- ════════════════════════════════════════════════════════════
alter function private.tg_set_updated_at()
  set search_path = public, pg_temp;

alter function private.tg_asignar_codigo_agremiado()
  set search_path = public, pg_temp;

alter function private.estado_vencimiento(date)
  set search_path = public, pg_temp;

-- ════════════════════════════════════════════════════════════
-- 2) Mover extensiones a schema `extensions` (estándar Supabase)
--    `ALTER EXTENSION ... SET SCHEMA` mueve los operadores y
--    funciones, y Postgres actualiza automáticamente las
--    referencias de índices y constraints que dependen de ellos.
-- ════════════════════════════════════════════════════════════
create schema if not exists extensions;

-- pg_trgm: usado por índices GIN para búsqueda fuzzy
alter extension pg_trgm set schema extensions;

-- btree_gist: usado por el EXCLUDE constraint cc_no_overlap
alter extension btree_gist set schema extensions;

-- Asegurar que el search_path del rol authenticated incluya extensions
-- para que los operadores (%, &&, etc.) sigan resolviéndose.
grant usage on schema extensions to anon, authenticated, service_role;
alter role authenticated set search_path = "$user", public, extensions;
alter role anon          set search_path = "$user", public, extensions;
alter role service_role  set search_path = "$user", public, extensions;

comment on schema extensions is
  'Schema para extensiones Postgres (pg_trgm, btree_gist). Estándar Supabase para no contaminar public.';

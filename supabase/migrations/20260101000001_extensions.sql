-- ─────────────────────────────────────────────────────────────
-- 001 — Extensiones de PostgreSQL necesarias
-- ─────────────────────────────────────────────────────────────

-- UUIDs (gen_random_uuid)
create extension if not exists "pgcrypto";

-- Búsqueda de texto fuzzy (para búsqueda de socios por nombre)
create extension if not exists "pg_trgm";

-- Funciones de fechas avanzadas
create extension if not exists "btree_gist";

-- Schema "private" para funciones helpers internas
create schema if not exists private;

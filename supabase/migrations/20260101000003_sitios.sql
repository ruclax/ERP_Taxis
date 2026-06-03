-- ─────────────────────────────────────────────────────────────
-- 003 — Sitios (ubicaciones de operación de taxis)
-- ─────────────────────────────────────────────────────────────

create table sitios (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null unique,
  direccion    text,
  telefono     text,
  -- Delegado actual del sitio (FK a socios; añadida en migración posterior por dependencia circular)
  delegado_socio_id uuid,
  -- Áreas funcionales (1, 2, 3, 4) — relacionadas con Secretarios de Trabajo y Conflictos
  area_num     int check (area_num between 1 and 8),
  notas        text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index sitios_nombre_trgm on sitios using gin (nombre gin_trgm_ops);

comment on table sitios is 'Ubicaciones físicas donde operan los taxis (Puente 1, Central Senda, Central ETN, etc.). Vienen del CSV #4 col SITIO.';
comment on column sitios.delegado_socio_id is 'Socio actualmente designado como delegado/jefe del sitio (rotativo).';
comment on column sitios.area_num is 'Área funcional del sindicato a la que pertenece el sitio (Sec. Trabajo y Conflictos #1-#4).';

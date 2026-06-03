-- ─────────────────────────────────────────────────────────────
-- 004 — Socios (padrón unificado: general + escalafón)
-- Origen: CSV #1 (Agremiados) + CSV #2 (Escalafón)
-- ─────────────────────────────────────────────────────────────

create table socios (
  id                  uuid primary key default gen_random_uuid(),

  -- Identificación oficial
  rfc                 text unique,
  curp                text unique,
  nombre_completo     text not null,
  apellido_paterno    text,
  apellido_materno    text,
  nombre              text,

  -- Datos personales
  fecha_nacimiento    date,
  lugar_nacimiento    text,
  genero              genero,
  estado_civil        text,
  escolaridad         text,

  -- Ranking sindical (CSV #2 — solo activos lo tienen)
  escalafon_numero    int unique,

  -- Tipo y estado
  tipo_socio          tipo_socio not null default 'CONCESIONARIO',
  estatus             socio_estatus not null default 'ACTIVO',

  -- Categorías sindicales (CSV #1)
  soc_act             boolean not null default false,  -- Socio actual
  soc_veint           boolean not null default false,  -- Socio de 20 años (veteranía)
  soc_tran            boolean not null default false,  -- Socio en transición
  turno               text,                            -- Turno asignado
  firma_actual        firma_estatus not null default 'PENDIENTE',

  -- Ingreso / baja
  fecha_ingreso       date,
  fecha_baja          date,
  motivo_baja         text,
  fecha_fallecimiento date,

  -- Antiguedad calculada (vista derivada en otro lugar; aquí solo persistimos lo crudo)
  antiguedad_anos     int,

  -- Notas libres del registrador (CSV #1 col COMENTARIOS)
  comentarios         text,

  -- Auditoría
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by_user_id  uuid references auth.users(id) on delete set null,
  updated_by_user_id  uuid references auth.users(id) on delete set null,

  -- Foto / gafete (Supabase Storage URL)
  foto_url            text,

  constraint socios_fecha_baja_check check (
    (estatus in ('BAJA_DEFINITIVA','BAJA_TEMPORAL') and fecha_baja is not null)
    or (estatus not in ('BAJA_DEFINITIVA','BAJA_TEMPORAL'))
  ),
  constraint socios_fecha_fallecimiento_check check (
    (estatus = 'FALLECIDO' and fecha_fallecimiento is not null)
    or (estatus <> 'FALLECIDO')
  )
);

-- Búsqueda eficiente por nombre (autocompletado)
create index socios_nombre_trgm on socios using gin (nombre_completo gin_trgm_ops);
create index socios_rfc on socios (rfc);
create index socios_curp on socios (curp);
create index socios_escalafon on socios (escalafon_numero) where escalafon_numero is not null;
create index socios_estatus on socios (estatus);
create index socios_tipo on socios (tipo_socio);

-- Trigger updated_at
create or replace function private.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger socios_set_updated_at
  before update on socios
  for each row execute function private.tg_set_updated_at();

-- Ahora añadimos la FK pendiente de sitios.delegado_socio_id
alter table sitios
  add constraint sitios_delegado_socio_fk
  foreign key (delegado_socio_id) references socios(id) on delete set null;

comment on table socios is 'Padrón unificado de personas del sindicato — incluye activos, fallecidos (+), bajas y "veremos". Un solo registro por persona física.';
comment on column socios.escalafon_numero is 'Posición en el escalafón sindical (CSV #2 col No.). Solo se asigna a socios activos.';
comment on column socios.soc_act is 'Categoría sindical SOC_ACT del CSV #1 — socio actualmente activo.';
comment on column socios.soc_veint is 'Categoría SOC_VEINT — más de 20 años de antiguedad (veteranía).';
comment on column socios.soc_tran is 'Categoría SOC_TRAN — socio en transición.';

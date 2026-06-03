-- ─────────────────────────────────────────────────────────────
-- 031 — Modelo dual de choferes:
--   • concesion_choferes      → vínculo laboral chofer↔concesión (taxi #económico)
--   • historial_choferes      → ya existe: asignación a vehículo específico
--
-- Caso de uso: el chofer trabaja "el taxi #47 de Puente 1". Si el
-- concesionario renueva la unidad, el chofer sigue trabajando bajo
-- la misma concesión (otro vehículo). La tabla `historial_choferes`
-- registra qué unidad operó cada chofer en cada periodo.
-- ─────────────────────────────────────────────────────────────

create type chofer_rol as enum (
  'CHOFER',        -- chofer principal de la unidad
  'CHOFER_RELEVO', -- segundo/tercer turno
  'AYUDANTE'
);

create table concesion_choferes (
  id                  uuid primary key default gen_random_uuid(),

  concesion_id        uuid not null references concesiones(id) on delete cascade,
  chofer_socio_id     uuid not null references socios(id) on delete restrict,

  rol                 chofer_rol not null default 'CHOFER',
  fecha_inicio        date not null,
  fecha_fin           date,                  -- NULL = activo

  -- Económico opcional: % de la cuenta o renta fija
  porcentaje          numeric(5,2),          -- 0–100
  renta_diaria        numeric(10,2),         -- alternativa a porcentaje

  -- Documentos
  foto_gafete_url     text,
  foto_credencial_url text,

  observaciones       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint cc_fechas_check
    check (fecha_fin is null or fecha_fin >= fecha_inicio),
  constraint cc_economico_check
    check (porcentaje is null or (porcentaje >= 0 and porcentaje <= 100))
);

create index cc_concesion        on concesion_choferes (concesion_id);
create index cc_chofer           on concesion_choferes (chofer_socio_id);
create index cc_activo_concesion on concesion_choferes (concesion_id) where fecha_fin is null;
create index cc_activo_chofer    on concesion_choferes (chofer_socio_id) where fecha_fin is null;

-- Evita dos contratos abiertos del mismo chofer en la misma concesión
create unique index cc_unique_activo
  on concesion_choferes (concesion_id, chofer_socio_id)
  where fecha_fin is null;

-- Rangos no se sobreponen para el mismo (concesion, chofer) — exclusión por gist
create extension if not exists btree_gist;
alter table concesion_choferes add constraint cc_no_overlap
  exclude using gist (
    concesion_id with =,
    chofer_socio_id with =,
    daterange(fecha_inicio, coalesce(fecha_fin, 'infinity'::date), '[]') with &&
  );

create trigger cc_set_updated_at
  before update on concesion_choferes
  for each row execute function private.tg_set_updated_at();

comment on table concesion_choferes is
  'Vínculo laboral chofer↔concesión (taxi #económico). Quién manda en el "taxi #47" del sitio X durante qué periodo. La asignación a un vehículo específico vive en historial_choferes.';

-- ── Vincular historial_choferes con concesion_choferes (opcional) ──
-- Permite saber: "este chofer manejó el Aveo del 1-15, luego el Spark del 16+,
-- todo bajo el mismo contrato laboral en la concesión 27P-0325".
alter table historial_choferes
  add column if not exists concesion_chofer_id uuid
    references concesion_choferes(id) on delete set null;

create index if not exists hc_concesion_chofer
  on historial_choferes (concesion_chofer_id)
  where concesion_chofer_id is not null;

-- ── RLS ──
alter table concesion_choferes enable row level security;

-- Lectura: cualquier usuario autenticado con rol asignado
create policy cc_read on concesion_choferes
  for select to authenticated
  using (
    exists (
      select 1 from usuarios_roles ur
      where ur.user_id = auth.uid() and ur.activo = true
    )
  );

-- Escritura: sec_general, sec_organizacion, o el concesionario titular
create policy cc_write on concesion_choferes
  for all to authenticated
  using (
    private.user_tiene_rol('superadmin')
    or private.user_tiene_rol('sec_general')
    or private.user_tiene_rol('sec_organizacion')
    or exists (
      select 1 from concesiones c
      join usuarios_perfil up on up.socio_id = c.socio_id
      where c.id = concesion_choferes.concesion_id and up.user_id = auth.uid()
    )
  )
  with check (
    private.user_tiene_rol('superadmin')
    or private.user_tiene_rol('sec_general')
    or private.user_tiene_rol('sec_organizacion')
    or exists (
      select 1 from concesiones c
      join usuarios_perfil up on up.socio_id = c.socio_id
      where c.id = concesion_choferes.concesion_id and up.user_id = auth.uid()
    )
  );

-- ── Vista del "Taxi Económico" ──
-- Un solo SELECT trae la información que un usuario quiere ver del taxi #47:
-- sitio, #económico, concesión, concesionario, vehículo actual, # choferes activos.
create or replace view v_taxi_economico as
select
  c.id                                              as concesion_id,
  c.numero_concesion,
  c.taxi_numero,
  c.estado                                          as concesion_estado,
  s.id                                              as sitio_id,
  s.nombre                                          as sitio_nombre,

  conc.id                                           as concesionario_socio_id,
  conc.nombre_completo                              as concesionario_nombre,
  conc.escalafon_numero                             as concesionario_escalafon,

  v.id                                              as vehiculo_actual_id,
  v.placas,
  v.marca, v.modelo, v.anio, v.color, v.estatus     as vehiculo_estatus,

  (select count(*) from concesion_choferes cc
    where cc.concesion_id = c.id and cc.fecha_fin is null) as choferes_activos
from concesiones c
left join sitios   s    on s.id = c.sitio_id
left join socios   conc on conc.id = c.socio_id
left join vehiculos v   on v.concesion_actual_id = c.id;

comment on view v_taxi_economico is
  'Vista "Taxi #económico" — identidad pública del taxi (sitio + #taxi) junto con su concesión, concesionario, vehículo actual y conteo de choferes activos.';

grant select on v_taxi_economico to authenticated;

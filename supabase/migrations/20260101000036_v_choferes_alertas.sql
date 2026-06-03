-- ─────────────────────────────────────────────────────────────
-- 036 — Vista `v_choferes_alertas`.
-- Por cada contrato ACTIVO (`concesion_choferes` con `fecha_fin IS NULL`)
-- calcula en una fila todas las alertas que importan al sec_organizacion:
--   - Si el chofer también es concesionario vigente
--   - Sitio donde opera el taxi
--   - Estado de documentos del CHOFER (licencia, antidoping)
--   - Estado del VEHÍCULO que opera (póliza, revista)
--   - Adeudos del chofer (mensualidades pendientes, accidentes sin liquidar)
--
-- Cuatro estados de vencimiento estandarizados:
--   SIN_REGISTRO · VENCIDA · URGENTE (≤7d) · PROXIMA (≤30d) · VIGENTE
-- ─────────────────────────────────────────────────────────────

create or replace function private.estado_vencimiento(fecha date)
returns text
language sql
immutable
as $$
  select case
    when fecha is null               then 'SIN_REGISTRO'
    when fecha <  current_date       then 'VENCIDA'
    when fecha <= current_date + 7   then 'URGENTE'
    when fecha <= current_date + 30  then 'PROXIMA'
    else 'VIGENTE'
  end;
$$;

create or replace view public.v_choferes_alertas as
with veh_actual as (
  select v.concesion_actual_id as concesion_id, v.id as vehiculo_id
  from public.vehiculos v
  where v.concesion_actual_id is not null
)
select
  cc.id                          as contrato_id,
  cc.chofer_socio_id,
  cc.concesion_id,
  cc.rol,
  cc.fecha_inicio,
  cc.fecha_fin,
  cc.porcentaje,
  cc.renta_diaria,

  -- Datos del chofer
  s.codigo_agremiado             as chofer_codigo,
  s.nombre_completo              as chofer_nombre,
  s.rfc                          as chofer_rfc,
  s.escalafon_numero             as chofer_escalafon,
  s.tipo_escalafon               as chofer_tipo_escalafon,
  s.ocupacion                    as chofer_ocupacion,
  s.estatus                      as chofer_estatus,

  -- ¿Concesionario vigente? (tiene al menos una concesión VIGENTE)
  exists(
    select 1 from public.concesiones c2
    where c2.socio_id = cc.chofer_socio_id and c2.estado = 'VIGENTE'
  )                              as es_concesionario,

  -- Datos de la concesión que opera
  c.numero_concesion,
  c.taxi_numero,
  c.estado                       as concesion_estado,
  c.sitio_id,
  st.nombre                      as sitio_nombre,

  -- Titular de la concesión (puede ser distinto al chofer)
  titular.id                     as titular_socio_id,
  titular.nombre_completo        as titular_nombre,

  -- Vehículo actual de la concesión
  veh.vehiculo_id,
  v.placas                       as vehiculo_placas,

  -- ── Documentos del CHOFER ──
  lic.fecha_vencimiento          as licencia_vence,
  private.estado_vencimiento(lic.fecha_vencimiento) as licencia_estado,

  ad.ultima_fecha                as antidoping_vence,
  private.estado_vencimiento(ad.ultima_fecha) as antidoping_estado,

  -- ── Documentos del VEHÍCULO que opera ──
  pol.fecha_vencimiento          as poliza_vence,
  private.estado_vencimiento(pol.fecha_vencimiento) as poliza_estado,

  rev.fecha_efectiva             as revista_vence,
  private.estado_vencimiento(rev.fecha_efectiva) as revista_estado,

  -- ── Adeudos del chofer ──
  coalesce(mens.n, 0)            as mensualidades_pendientes,
  coalesce(acc.n, 0)             as accidentes_pendientes

from public.concesion_choferes cc
join public.socios s on s.id = cc.chofer_socio_id
left join public.concesiones c on c.id = cc.concesion_id
left join public.sitios st on st.id = c.sitio_id
left join public.socios titular on titular.id = c.socio_id
left join veh_actual veh on veh.concesion_id = c.id
left join public.vehiculos v on v.id = veh.vehiculo_id

-- Licencia actual del chofer
left join lateral (
  select fecha_vencimiento from public.socios_licencia_conducir
  where socio_id = cc.chofer_socio_id and es_actual = true
  order by fecha_vencimiento desc nulls last limit 1
) lic on true

-- Último antidoping del chofer
left join lateral (
  select max(fecha_vencimiento) as ultima_fecha
  from public.antidoping
  where socio_id = cc.chofer_socio_id
) ad on true

-- Póliza más reciente del vehículo
left join lateral (
  select fecha_vencimiento from public.polizas
  where vehiculo_id = veh.vehiculo_id
  order by fecha_vencimiento desc nulls last limit 1
) pol on true

-- Revista más reciente (toma la mayor entre fecha_vencimiento y prorroga_hasta)
left join lateral (
  select greatest(max(fecha_vencimiento), max(prorroga_hasta)) as fecha_efectiva
  from public.revistas_vehiculares
  where vehiculo_id = veh.vehiculo_id
) rev on true

-- Mensualidades pendientes del chofer
left join lateral (
  select count(*)::int as n
  from public.mensualidades_cuotas
  where socio_id = cc.chofer_socio_id
    and estatus in ('PENDIENTE','VENCIDO','PARCIAL')
) mens on true

-- Accidentes no liquidados del chofer
left join lateral (
  select count(*)::int as n
  from public.bitacora_accidentes
  where chofer_socio_id = cc.chofer_socio_id and liquidado = false
) acc on true

where cc.fecha_fin is null;

comment on view public.v_choferes_alertas is
  'Una fila por contrato de chofer ACTIVO con todas las alertas precalculadas: documentación personal (licencia, antidoping), del vehículo (póliza, revista), adeudos (mensualidades, accidentes) y si es también concesionario vigente.';

grant select on public.v_choferes_alertas to authenticated;

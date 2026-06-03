-- ─────────────────────────────────────────────────────────────
-- 041 — Recrear `v_choferes_alertas` para exponer `tipo_padron`
-- del padrón oficial en vez del cálculo `es_concesionario` por JOIN.
--
-- `tipo_padron` es la clasificación FORMAL del sindicato:
--   • CONCESIONARIO  → titular oficial de concesión (aunque su concesión
--                      esté en BAJA, sigue siendo CONCESIONARIO en padrón)
--   • TRANSITORIO    → opera temporalmente, sin titularidad permanente
--   • CUOTA_25       → cuota especial del 25%
--   • NULL           → sin clasificación formal en padrón (puede operar igual)
--
-- Reemplaza el campo `es_concesionario` calculado, que mezclaba dos
-- conceptos distintos (clasificación formal vs concesión vigente).
-- ─────────────────────────────────────────────────────────────

drop view if exists public.v_choferes_alertas;

create view public.v_choferes_alertas as
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

  s.codigo_agremiado             as chofer_codigo,
  s.nombre_completo              as chofer_nombre,
  s.rfc                          as chofer_rfc,
  s.escalafon_numero             as chofer_escalafon,
  s.tipo_escalafon               as chofer_tipo_escalafon,
  s.ocupacion                    as chofer_ocupacion,
  s.estatus                      as chofer_estatus,

  -- Clasificación formal del padrón (reemplaza es_concesionario)
  s.tipo_padron                  as chofer_tipo_padron,

  c.numero_concesion,
  c.taxi_numero,
  c.estado                       as concesion_estado,
  c.sitio_id,
  st.nombre                      as sitio_nombre,

  titular.id                     as titular_socio_id,
  titular.nombre_completo        as titular_nombre,

  veh.vehiculo_id,
  v.placas                       as vehiculo_placas,

  lic.fecha_vencimiento          as licencia_vence,
  private.estado_vencimiento(lic.fecha_vencimiento) as licencia_estado,

  ad.ultima_fecha                as antidoping_vence,
  private.estado_vencimiento(ad.ultima_fecha) as antidoping_estado,

  pol.fecha_vencimiento          as poliza_vence,
  private.estado_vencimiento(pol.fecha_vencimiento) as poliza_estado,

  rev.fecha_efectiva             as revista_vence,
  private.estado_vencimiento(rev.fecha_efectiva) as revista_estado,

  coalesce(mens.n, 0)            as mensualidades_pendientes,
  coalesce(acc.n, 0)             as accidentes_pendientes

from public.concesion_choferes cc
join public.socios s on s.id = cc.chofer_socio_id
left join public.concesiones c on c.id = cc.concesion_id
left join public.sitios st on st.id = c.sitio_id
left join public.socios titular on titular.id = c.socio_id
left join veh_actual veh on veh.concesion_id = c.id
left join public.vehiculos v on v.id = veh.vehiculo_id

left join lateral (
  select fecha_vencimiento from public.socios_licencia_conducir
  where socio_id = cc.chofer_socio_id and es_actual = true
  order by fecha_vencimiento desc nulls last limit 1
) lic on true

left join lateral (
  select max(fecha_vencimiento) as ultima_fecha
  from public.antidoping where socio_id = cc.chofer_socio_id
) ad on true

left join lateral (
  select fecha_vencimiento from public.polizas
  where vehiculo_id = veh.vehiculo_id
  order by fecha_vencimiento desc nulls last limit 1
) pol on true

left join lateral (
  select greatest(max(fecha_vencimiento), max(prorroga_hasta)) as fecha_efectiva
  from public.revistas_vehiculares where vehiculo_id = veh.vehiculo_id
) rev on true

left join lateral (
  select count(*)::int as n
  from public.mensualidades_cuotas
  where socio_id = cc.chofer_socio_id
    and estatus in ('PENDIENTE','VENCIDO','PARCIAL')
) mens on true

left join lateral (
  select count(*)::int as n
  from public.bitacora_accidentes
  where chofer_socio_id = cc.chofer_socio_id and liquidado = false
) acc on true

where cc.fecha_fin is null;

comment on view public.v_choferes_alertas is
  'Una fila por contrato activo. Expone `chofer_tipo_padron` (clasificación FORMAL del CSV: CONCESIONARIO/TRANSITORIO/CUOTA_25/null) en vez de un boolean inferido. Incluye documentación (licencia, antidoping), vehículo (póliza, revista) y adeudos.';

grant select on public.v_choferes_alertas to authenticated;

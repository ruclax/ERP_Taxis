-- ─────────────────────────────────────────────────────────────
-- 034 — Vista `v_vehiculos_listado` que aplana datos del taxi
-- para que la query de /flota pueda ordenar por #económico
-- (que vive en `concesiones`, no en `vehiculos`).
--
-- Incluye también el código del agremiado titular para auto-completar
-- la tarjeta de cada unidad sin hacer joins en cliente.
-- ─────────────────────────────────────────────────────────────

create or replace view public.v_vehiculos_listado as
select
  v.id,
  v.placas,
  v.numero_serie,
  v.marca, v.modelo, v.anio, v.color, v.engomado,
  v.estatus,
  v.es_independiente,
  v.concesion_actual_id,

  -- Datos de la concesión actual
  c.numero_concesion,
  c.taxi_numero,
  c.sitio_id,
  c.socio_id        as titular_socio_id,

  -- Identidad del titular
  s.codigo_agremiado as titular_codigo,
  s.nombre_completo  as titular_nombre,
  s.escalafon_numero as titular_escalafon,

  -- Nombre del sitio (para mostrar sin extra join)
  st.nombre as sitio_nombre

from public.vehiculos v
left join public.concesiones c on c.id = v.concesion_actual_id
left join public.socios     s on s.id = c.socio_id
left join public.sitios     st on st.id = c.sitio_id;

comment on view public.v_vehiculos_listado is
  'Vista plana de vehículos con datos de su concesión activa, titular y sitio. Pensada para listados /flota y /taxis. Ordenable por taxi_numero, placas, titular_codigo, etc.';

grant select on public.v_vehiculos_listado to authenticated;

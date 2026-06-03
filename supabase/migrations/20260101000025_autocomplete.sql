-- ─────────────────────────────────────────────────────────────
-- 025 — RPCs de autocompletado para socios y vehículos.
-- Devuelven una lista corta (máx 8) con info suficiente para sugerir en dropdown.
-- ─────────────────────────────────────────────────────────────

-- Socios: devuelve id, nombre, badge (Escalafón / RFC / Concesión / Placa)
create or replace function public.sugerir_socios(q text)
returns table (
  id uuid,
  nombre text,
  sub text,
  badge text
)
language plpgsql
stable
security invoker
as $$
declare
  qt text := trim(q);
  qu text := upper(trim(q));
begin
  if length(qt) < 2 then return; end if;

  -- Concesión
  if qu ~ '^27P+-?\d*$' then
    return query
      select s.id, s.nombre_completo as nombre, c.numero_concesion as sub, 'Concesión'::text as badge
      from socios s
      join concesiones c on c.socio_id = s.id
      where c.numero_concesion ilike qu || '%'
      order by c.numero_concesion limit 8;
    return;
  end if;

  -- Placas
  if qu ~ '^[A-Z]\d{0,3}[A-Z]{0,4}$' and length(qu) >= 3 then
    return query
      select distinct on (s.id)
        s.id, s.nombre_completo as nombre, v.placas as sub, 'Placas'::text as badge
      from socios s
      join concesiones c on c.socio_id = s.id
      join vehiculos v on v.concesion_actual_id = c.id
      where v.placas ilike qu || '%'
      order by s.id, v.placas limit 8;
    return;
  end if;

  -- Número (escalafón o taxi)
  if qt ~ '^\d{1,5}$' then
    return query
      (select s.id, s.nombre_completo as nombre, ('Escalafón #' || s.escalafon_numero)::text as sub, 'Escalafón'::text as badge
       from socios s
       where s.escalafon_numero = qt::int
       limit 4)
      union all
      (select distinct on (s.id) s.id, s.nombre_completo as nombre, ('Taxi #' || c.taxi_numero)::text as sub, 'Taxi'::text as badge
       from socios s
       join concesiones c on c.socio_id = s.id
       where c.taxi_numero = qt::int
       limit 4);
    return;
  end if;

  -- Default: nombre (prefijo + LIKE)
  return query
    select s.id, s.nombre_completo as nombre,
           coalesce(s.rfc, '—') as sub,
           case when s.escalafon_numero is not null then 'Esc.#' || s.escalafon_numero else 'Socio' end as badge
    from socios s
    where s.nombre_completo ilike '%' || qt || '%'
    order by
      case when s.nombre_completo ilike qt || '%' then 0 else 1 end,  -- empieza-con primero
      s.nombre_completo
    limit 8;
end;
$$;


-- Vehículos: devuelve id, placas, marca/modelo, concesión, titular
create or replace function public.sugerir_vehiculos(q text)
returns table (
  id uuid,
  placas text,
  sub text,
  badge text
)
language plpgsql
stable
security invoker
as $$
declare
  qt text := trim(q);
  qu text := upper(trim(q));
begin
  if length(qt) < 2 then return; end if;

  -- Placas
  if qu ~ '^[A-Z]\d{0,3}[A-Z]{0,4}$' and length(qu) >= 3 then
    return query
      select v.id, v.placas, (coalesce(v.marca,'') || ' ' || coalesce(v.modelo,''))::text as sub,
             'Placas'::text as badge
      from vehiculos v
      where v.placas ilike qu || '%'
      order by v.placas limit 8;
    return;
  end if;

  -- Concesión
  if qu ~ '^27P+-?\d*$' then
    return query
      select v.id, v.placas, c.numero_concesion as sub, 'Concesión'::text as badge
      from vehiculos v
      join concesiones c on c.id = v.concesion_actual_id
      where c.numero_concesion ilike qu || '%'
      order by c.numero_concesion limit 8;
    return;
  end if;

  -- Año
  if qt ~ '^(19|20)\d{2}$' then
    return query
      select v.id, v.placas,
             (coalesce(v.marca,'') || ' ' || coalesce(v.modelo,'') || ' ' || v.anio::text)::text as sub,
             'Año'::text as badge
      from vehiculos v
      where v.anio = qt::int
      order by v.placas limit 8;
    return;
  end if;

  -- Default: marca/modelo
  return query
    select v.id, v.placas,
           (coalesce(v.marca,'') || ' ' || coalesce(v.modelo,'') || coalesce(' ' || v.anio::text,''))::text as sub,
           coalesce(v.marca, 'Vehículo')::text as badge
    from vehiculos v
    where v.marca ilike '%' || qt || '%' or v.modelo ilike '%' || qt || '%'
    order by v.marca, v.modelo limit 8;
end;
$$;

comment on function public.sugerir_socios(text) is 'Top 8 sugerencias de socios para autocompletado.';
comment on function public.sugerir_vehiculos(text) is 'Top 8 sugerencias de vehículos para autocompletado.';

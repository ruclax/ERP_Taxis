-- ─────────────────────────────────────────────────────────────
-- 024 — Búsqueda inteligente de vehículos
-- Detecta tipo: placas, concesión, número de serie (VIN), año, marca/modelo,
-- número de taxi, o nombre del socio titular.
-- ─────────────────────────────────────────────────────────────

create or replace function public.buscar_vehiculos(q text)
returns setof uuid
language plpgsql
stable
security invoker
as $$
declare
  qt text := trim(q);
  qu text := upper(trim(q));
begin
  if length(qt) = 0 then return; end if;

  -- Número puro 1-4 dígitos: año o número de taxi
  if qt ~ '^\d{1,4}$' then
    return query
      select distinct v.id
      from vehiculos v
      left join concesiones c on c.id = v.concesion_actual_id
      where v.anio = qt::int
         or c.taxi_numero = qt::int
      limit 500;
    return;
  end if;

  -- Concesión (27P-XXXX)
  if qu ~ '^27P+-\d{1,5}$' then
    return query
      select distinct v.id
      from vehiculos v
      join concesiones c on c.id = v.concesion_actual_id
      where c.numero_concesion ilike '%' || qu || '%'
      limit 500;
    return;
  end if;

  -- Placas mexicanas (formato A445VUV)
  if qu ~ '^[A-Z]\d{2,3}[A-Z]{2,4}$' then
    return query
      select v.id from vehiculos v
      where v.placas ilike '%' || qu || '%'
      limit 50;
    return;
  end if;

  -- VIN (17 chars alfanuméricos típicamente)
  if qu ~ '^[A-Z0-9]{10,17}$' then
    return query
      select v.id from vehiculos v
      where v.numero_serie ilike qu || '%'
      limit 50;
    return;
  end if;

  -- Default: marca, modelo, o nombre del socio titular
  return query
    select distinct v.id
    from vehiculos v
    left join concesiones c on c.id = v.concesion_actual_id
    left join socios s on s.id = c.socio_id
    where v.marca ilike '%' || qt || '%'
       or v.modelo ilike '%' || qt || '%'
       or s.nombre_completo ilike '%' || qt || '%'
    limit 500;
end;
$$;

comment on function public.buscar_vehiculos(text) is
  'Búsqueda inteligente de vehículos. Detecta tipo: número → año/taxi · concesión · placas · VIN · texto → marca/modelo/titular.';

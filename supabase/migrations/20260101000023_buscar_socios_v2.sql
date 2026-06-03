-- ─────────────────────────────────────────────────────────────
-- 023 — Búsqueda inteligente: detecta tipo de input y matchea solo el campo correcto.
-- Antes: cualquier número matcheaba contra RFC (que contiene fechas), produciendo
--        cientos de matches falsos.
-- Ahora: si input es número puro → solo escalafón/taxi
--        si formato RFC → solo RFC
--        etc.
-- También: LIMIT interno para no devolver más de 500 IDs (proteger URL length).
-- ─────────────────────────────────────────────────────────────

create or replace function public.buscar_socios(q text)
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

  -- Solo número → escalafón o taxi (sin nombre/RFC/CURP)
  if qt ~ '^\d{1,5}$' then
    return query
      select distinct s.id
      from socios s
      left join concesiones c on c.socio_id = s.id
      where s.escalafon_numero = qt::int
         or c.taxi_numero = qt::int
      limit 500;
    return;
  end if;

  -- Concesión (27P-XXXX o 27PP-XXXX) → solo concesión
  if qu ~ '^27P+-\d{1,5}$' then
    return query
      select distinct s.id
      from socios s
      join concesiones c on c.socio_id = s.id
      where c.numero_concesion ilike '%' || qu || '%'
      limit 500;
    return;
  end if;

  -- Placas mexicanas (1 letra + 3 dígitos + 3 letras, ej. A445VUV)
  if qu ~ '^[A-Z]\d{2,3}[A-Z]{2,4}$' then
    return query
      select distinct s.id
      from socios s
      join concesiones c on c.socio_id = s.id
      join vehiculos v   on v.concesion_actual_id = c.id
      where v.placas ilike '%' || qu || '%'
      limit 500;
    return;
  end if;

  -- CURP (18 chars: 4 letras + 6 digits + H/M + 5 letras + 2 alfanum)
  if qu ~ '^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$' then
    return query
      select s.id from socios s where s.curp = qu limit 1;
    return;
  end if;

  -- RFC (13 chars persona física o 12 moral) → buscar por RFC
  if qu ~ '^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$' then
    return query
      select s.id from socios s where s.rfc = qu limit 1;
    return;
  end if;

  -- Default: nombre (también busca parcial en RFC y CURP si la query tiene letras)
  return query
    select distinct s.id
    from socios s
    where s.nombre_completo ilike '%' || qt || '%'
       or s.rfc ilike qu || '%'   -- prefijo, no '%LIKE%'
       or s.curp ilike qu || '%'
    limit 500;
end;
$$;

comment on function public.buscar_socios(text) is
  'Búsqueda inteligente con detección de tipo. Si número → escalafón/taxi. Si concesión/placas/RFC/CURP → campo exacto. Si texto → nombre. Máx 500 resultados.';

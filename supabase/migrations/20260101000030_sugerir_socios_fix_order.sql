-- ─────────────────────────────────────────────────────────────
-- 029 — Dedup en sugerir_socios para el branch numérico.
-- Cuando #escalafón == #taxi del mismo socio, el UNION ALL devolvía
-- el mismo socio dos veces, rompiendo la key de React en el cliente.
-- ─────────────────────────────────────────────────────────────

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

  if qu ~ '^27P+-?\d*$' and length(qu) >= 3 then
    return query
      select distinct on (s.id)
        s.id, s.nombre_completo as nombre, c.numero_concesion as sub, 'Concesión'::text as badge
      from socios s
      join concesiones c on c.socio_id = s.id
      where c.numero_concesion ilike qu || '%'
      order by s.id, c.numero_concesion limit 8;
    return;
  end if;

  if qu ~ '^[A-Z]\d+[A-Z]*$' and length(qu) >= 3 then
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

  -- Número puro (escalafón o taxi) — UNION garantiza dedup
  if qt ~ '^\d{1,5}$' then
    return query
      select * from (
        (select s.id, s.nombre_completo as nombre,
                ('Escalafón #' || s.escalafon_numero)::text as sub,
                'Escalafón'::text as badge
         from socios s
         where s.escalafon_numero = qt::int
         limit 4)
        union
        (select distinct on (s.id)
                s.id, s.nombre_completo as nombre,
                ('Taxi #' || c.taxi_numero)::text as sub,
                'Taxi'::text as badge
         from socios s
         join concesiones c on c.socio_id = s.id
         where c.taxi_numero = qt::int
         order by s.id
         limit 4)
      ) u
      limit 8;
    return;
  end if;

  return query
    select s.id, s.nombre_completo as nombre,
           coalesce(s.rfc, '—') as sub,
           case when s.escalafon_numero is not null then 'Esc. #' || s.escalafon_numero else 'Socio' end as badge
    from socios s
    where s.nombre_completo ilike '%' || qt || '%'
    order by
      case when s.nombre_completo ilike qt || '%' then 0 else 1 end,
      s.nombre_completo
    limit 8;
end;
$$;

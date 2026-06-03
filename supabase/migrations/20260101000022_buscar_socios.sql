-- ─────────────────────────────────────────────────────────────
-- 022 — Búsqueda global de socios: nombre, RFC, CURP, concesión, placas, taxi
-- Devuelve los socio_ids que matchean en cualquiera de los campos cruzando
-- socios + concesiones + vehiculos.
--
-- Es SECURITY INVOKER → respeta las políticas RLS del usuario que llama.
-- ─────────────────────────────────────────────────────────────

create or replace function public.buscar_socios(q text)
returns setof uuid
language sql
stable
security invoker
as $$
  with input as (
    select trim(q) as q,
           lower(trim(q)) as q_lower,
           upper(trim(q)) as q_upper
  )
  select distinct s.id
  from socios s
  left join concesiones c on c.socio_id = s.id
  left join vehiculos v   on v.concesion_actual_id = c.id
  cross join input
  where
    -- Texto vacío: devuelve nada (la app no debe llamar con q vacío, pero seguridad)
    length(input.q) > 0
    and (
      -- Nombre (case-insensitive, con índice gin_trgm)
      s.nombre_completo ilike '%' || input.q || '%'
      -- RFC, CURP exactos o parciales
      or s.rfc ilike '%' || input.q_upper || '%'
      or s.curp ilike '%' || input.q_upper || '%'
      -- Concesión (formato 27P-0325)
      or c.numero_concesion ilike '%' || input.q_upper || '%'
      -- Placas
      or v.placas ilike '%' || input.q_upper || '%'
      -- Número interno de taxi del sitio (exacto)
      or (input.q ~ '^\d+$' and c.taxi_numero = input.q::int)
      -- Escalafón (si el usuario tipea el número)
      or (input.q ~ '^\d+$' and s.escalafon_numero = input.q::int)
    );
$$;

comment on function public.buscar_socios(text) is
  'Búsqueda global de socios cruzando nombre, RFC, CURP, concesión, placas, núm taxi y escalafón. Respeta RLS del invocador.';

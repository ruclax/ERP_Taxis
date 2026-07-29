-- ─────────────────────────────────────────────────────────────
-- 048 — M1: Alta de socio transaccional (ciclo de vida)
--
-- Reemplaza los 4 inserts sueltos del server action `crearSocio`
-- (socio → dirección → contacto → concesión) por UNA función
-- atómica. Antes, si un sub-insert fallaba se hacía console.error
-- y se seguía → el socio quedaba a medias. Además el action
-- mapeaba mal las columnas:
--   • dirección enviaba `municipio` (la tabla tiene `ciudad`)
--   • contacto enviaba `telefono_movil/fijo/email` como columnas,
--     pero `socios_contactos` es EAV (`tipo`/`valor`)
-- → dirección y contacto se perdían en silencio. Esto lo corrige.
--
-- SECURITY INVOKER: se ejecuta con los permisos del llamante, así
-- la RLS sigue gobernando (solo sec_general / sec_organizacion /
-- admin_plataforma / superadmin pueden insertar socios).
-- ─────────────────────────────────────────────────────────────

create or replace function public.crear_socio_completo(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_socio_id uuid;
  s  jsonb := coalesce(payload->'socio', '{}'::jsonb);
  d  jsonb := payload->'direccion';
  ct jsonb := payload->'contacto';
  cn jsonb := payload->'concesion';
begin
  if coalesce(trim(s->>'nombre_completo'), '') = '' then
    raise exception 'El nombre completo es obligatorio' using errcode = '23514';
  end if;

  -- 1) Socio (registra quién lo dio de alta)
  insert into socios (
    nombre_completo, rfc, curp, fecha_nacimiento, fecha_ingreso,
    tipo_socio, estatus, soc_act, soc_veint, soc_tran, comentarios,
    created_by_user_id
  ) values (
    trim(s->>'nombre_completo'),
    nullif(trim(s->>'rfc'), ''),
    nullif(trim(s->>'curp'), ''),
    (nullif(s->>'fecha_nacimiento', ''))::date,
    (nullif(s->>'fecha_ingreso', ''))::date,
    coalesce((s->>'tipo_socio')::tipo_socio, 'CONCESIONARIO'),
    coalesce((s->>'estatus')::socio_estatus, 'ACTIVO'),
    coalesce((s->>'soc_act')::boolean, false),
    coalesce((s->>'soc_veint')::boolean, false),
    coalesce((s->>'soc_tran')::boolean, false),
    nullif(trim(s->>'comentarios'), ''),
    auth.uid()
  )
  returning id into v_socio_id;

  -- 2) Dirección actual (opcional) — municipio → ciudad
  if d is not null and (
       coalesce(d->>'calle', '')     <> ''
    or coalesce(d->>'colonia', '')   <> ''
    or coalesce(d->>'municipio', '') <> ''
  ) then
    insert into socios_direcciones (
      socio_id, tipo, es_actual, calle, numero_ext, colonia, ciudad, estado, codigo_postal
    ) values (
      v_socio_id, 'ACTUAL', true,
      nullif(d->>'calle', ''),
      nullif(d->>'numero_ext', ''),
      nullif(d->>'colonia', ''),
      nullif(d->>'municipio', ''),
      nullif(d->>'estado', ''),
      nullif(d->>'codigo_postal', '')
    );
  end if;

  -- 3) Contactos (opcional) — modelo EAV tipo/valor
  if ct is not null then
    if coalesce(ct->>'telefono_movil', '') <> '' then
      insert into socios_contactos (socio_id, tipo, valor, es_principal)
      values (v_socio_id, 'TEL_CEL', ct->>'telefono_movil', true);
    end if;
    if coalesce(ct->>'telefono_fijo', '') <> '' then
      insert into socios_contactos (socio_id, tipo, valor, es_principal)
      values (v_socio_id, 'TEL_CASA', ct->>'telefono_fijo', false);
    end if;
    if coalesce(ct->>'email', '') <> '' then
      insert into socios_contactos (socio_id, tipo, valor, es_principal)
      values (v_socio_id, 'CORREO', ct->>'email', false);
    end if;
  end if;

  -- 4) Concesión (opcional)
  if cn is not null and coalesce(cn->>'numero_concesion', '') <> '' then
    insert into concesiones (numero_concesion, socio_id, sitio_id, taxi_numero, tipo, estado)
    values (
      upper(trim(cn->>'numero_concesion')),
      v_socio_id,
      (nullif(cn->>'sitio_id', ''))::uuid,
      (nullif(cn->>'taxi_numero', ''))::int,
      'CONCESION', 'VIGENTE'
    );
  end if;

  return v_socio_id;
end;
$$;

grant execute on function public.crear_socio_completo(jsonb) to authenticated;

comment on function public.crear_socio_completo(jsonb) is
  'M1 — Alta transaccional de socio (socio + dirección + contacto EAV + concesión) en una sola transacción. SECURITY INVOKER: respeta RLS.';

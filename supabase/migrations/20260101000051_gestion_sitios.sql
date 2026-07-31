-- ─────────────────────────────────────────────────────────────
-- 051 — Gestión de Sitios (delegado + integración RBAC)
--
-- 1) Vista de listado (sitio + delegado + # concesiones)
-- 2) RPC asignar_delegado_sitio: guarda sitios.delegado_socio_id y, si el
--    socio tiene cuenta de usuario, configura su rol `delegado` con scope
--    a ese sitio (desactivando al delegado anterior del sitio).
-- 3) Habilita el módulo `sitios` en los roles administrativos.
-- ─────────────────────────────────────────────────────────────

-- 1) Vista de listado ─────────────────────────────────────────
create or replace view public.v_sitios_listado
with (security_invoker = on) as
  select
    s.id,
    s.nombre,
    s.direccion,
    s.telefono,
    s.area_num,
    s.activo,
    s.delegado_socio_id,
    soc.nombre_completo as delegado_nombre,
    count(cc.id)::int   as concesiones,
    count(cc.id) filter (where cc.estado = 'VIGENTE')::int as concesiones_vigentes
  from sitios s
  left join socios soc      on soc.id = s.delegado_socio_id
  left join concesiones cc  on cc.sitio_id = s.id
  group by s.id, soc.nombre_completo;

-- 2) RPC de asignación de delegado (transaccional) ─────────────
-- SECURITY DEFINER: puede tocar sitios + usuarios_roles, pero con guard
-- explícito de rol al inicio.
create or replace function public.asignar_delegado_sitio(p_sitio_id uuid, p_socio_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  if not (
    private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])
    or private.user_es_admin_plataforma()
    or private.user_es_superadmin()
  ) then
    raise exception 'No autorizado para asignar delegados' using errcode = '42501';
  end if;

  -- Guarda el delegado en el sitio
  update sitios set delegado_socio_id = p_socio_id where id = p_sitio_id;

  -- Desactiva cualquier rol delegado con scope a este sitio (delegado anterior)
  update usuarios_roles
     set activo = false
   where rol_codigo = 'delegado' and scope_sitio_id = p_sitio_id;

  -- Si el nuevo delegado tiene cuenta de usuario, activa/crea su rol con scope
  if p_socio_id is not null then
    select up.user_id into v_user_id
      from usuarios_perfil up
     where up.socio_id = p_socio_id
     limit 1;

    if v_user_id is not null then
      if exists (
        select 1 from usuarios_roles
         where user_id = v_user_id and rol_codigo = 'delegado'
           and scope_sitio_id = p_sitio_id and scope_area_num is null
      ) then
        update usuarios_roles set activo = true
         where user_id = v_user_id and rol_codigo = 'delegado'
           and scope_sitio_id = p_sitio_id and scope_area_num is null;
      else
        insert into usuarios_roles (user_id, rol_codigo, scope_sitio_id, activo)
        values (v_user_id, 'delegado', p_sitio_id, true);
      end if;
    end if;
  end if;
end;
$$;

grant execute on function public.asignar_delegado_sitio(uuid, uuid) to authenticated;

comment on function public.asignar_delegado_sitio(uuid, uuid) is
  'Asigna/cambia el delegado de un sitio y sincroniza su rol RBAC (delegado con scope al sitio) si tiene cuenta. p_socio_id NULL desasigna.';

-- 3) Habilita el módulo `sitios` en los roles administrativos ──
update roles
   set modulos_acceso = modulos_acceso || '["sitios"]'::jsonb
 where codigo in ('superadmin', 'admin_plataforma', 'sec_general', 'sec_organizacion')
   and not (modulos_acceso @> '["sitios"]'::jsonb);

-- ─────────────────────────────────────────────────────────────
-- 038 — Extender escritura a `admin_plataforma` en todas las tablas
-- operativas del sistema.
--
-- El `superadmin` ya tiene política `superadmin_all` en cada tabla
-- gracias al helper `private.user_es_superadmin()`. Aquí agregamos un
-- helper análogo y políticas para `admin_plataforma`.
--
-- Exclusiones (admin_plataforma NO puede escribir):
--   • `roles`            — el catálogo de roles solo lo cambia el superadmin
--   • `impersonaciones`  — impersonar usuarios solo el superadmin
--
-- Resto de tablas: admin_plataforma tiene escritura plena. Cada acción
-- queda registrada en `auditoria` cuando la server action llama a logAction().
-- ─────────────────────────────────────────────────────────────

-- 1) Helper RLS
create or replace function private.user_es_admin_plataforma()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.usuarios_roles
    where user_id = auth.uid()
      and rol_codigo = 'admin_plataforma'
      and activo = true
      and (hasta is null or hasta >= current_date)
  );
$$;

comment on function private.user_es_admin_plataforma() is
  'true si el usuario autenticado tiene rol admin_plataforma activo y vigente.';

-- 2) Helper combinado para usos futuros (admin_plataforma OR superadmin)
create or replace function private.user_es_admin_global()
returns boolean
language sql
stable
security definer
as $$
  select private.user_es_superadmin() or private.user_es_admin_plataforma();
$$;

comment on function private.user_es_admin_global() is
  'true si el usuario es superadmin o admin_plataforma. Para "operadores administrativos" amplios.';

-- 3) Aplicar política admin_plataforma_all a TODAS las tablas operativas.
--    Iteramos sobre la lista de tablas con políticas de escritura existentes,
--    excluyendo `roles` e `impersonaciones` (privativas del superadmin).
do $$
declare
  tabla text;
  tablas text[] := array[
    'actas','acuerdos','adeudos','antidoping','asambleas','audiencias',
    'auditoria','bitacora_accidentes','branding_config','casos_honor_justicia',
    'concesion_choferes','concesiones','cuotas_catalogo','funerario_inscripciones',
    'funerario_planes_catalogo','funerario_servicios','historial_choferes',
    'mensualidades_cuotas','modulos_config','polizas','revistas_vehiculares',
    'sanciones_sitio','sitios','socios','socios_beneficiarios','socios_contactos',
    'socios_credencial_elector','socios_direcciones','socios_licencia_conducir',
    'tesoreria_cortes_caja','tesoreria_movimientos','usuarios_perfil',
    'usuarios_roles','vehiculo_asignaciones','vehiculos',
    'vehiculos_fuera_sindicato_notas'
  ];
begin
  foreach tabla in array tablas loop
    execute format(
      'drop policy if exists %I on public.%I;',
      tabla || '_admin_plataforma', tabla
    );
    execute format(
      'create policy %I on public.%I
         for all to authenticated
         using (private.user_es_admin_plataforma())
         with check (private.user_es_admin_plataforma());',
      tabla || '_admin_plataforma', tabla
    );
  end loop;
end;
$$;

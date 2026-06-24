-- ─────────────────────────────────────────────────────────────
-- 042 — Security + Performance hardening
-- Atiende los hallazgos del Supabase Advisor:
--   • security_definer_view       → 5 vistas a security_invoker=true
--   • function_search_path_mutable → 15 funciones con search_path fijo
--   • auth_rls_initplan           → 9 políticas con (select auth.uid())
--   • unindexed_foreign_keys      → 22 índices nuevos sobre FK
--
-- No se mueven las extensiones pg_trgm / btree_gist a otro schema
-- porque están en uso por índices GIN y constraints EXCLUDE; moverlas
-- requiere DROP CASCADE que rompería el padrón. Quedan como warnings
-- aceptados.
-- ─────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════
-- 1) VISTAS: security_invoker = true
-- ════════════════════════════════════════════════════════════
alter view public.v_choferes_alertas            set (security_invoker = true);
alter view public.v_polizas_actuales            set (security_invoker = true);
alter view public.v_socios_direccion_principal  set (security_invoker = true);
alter view public.v_taxi_economico              set (security_invoker = true);
alter view public.v_vehiculos_listado           set (security_invoker = true);

-- ════════════════════════════════════════════════════════════
-- 2) FUNCIONES: search_path explícito
--    Las nuestras necesitan acceder a tablas en `public` y a `auth.uid()`.
-- ════════════════════════════════════════════════════════════
alter function public.buscar_socios(text)       set search_path = public, auth, pg_temp;
alter function public.buscar_vehiculos(text)    set search_path = public, auth, pg_temp;
alter function public.sugerir_socios(text)      set search_path = public, auth, pg_temp;
alter function public.sugerir_vehiculos(text)   set search_path = public, auth, pg_temp;
alter function public.vista_conteos_padron()    set search_path = public, auth, pg_temp;
alter function public.vista_conteos_flota()     set search_path = public, auth, pg_temp;

alter function private.tg_handle_new_user()             set search_path = public, auth, pg_temp;
alter function private.user_tiene_rol(text)             set search_path = public, auth, pg_temp;
alter function private.user_tiene_alguno_de(text[])     set search_path = public, auth, pg_temp;
alter function private.user_sitio_scope()               set search_path = public, auth, pg_temp;
alter function private.user_area_scope()                set search_path = public, auth, pg_temp;
alter function private.user_es_miembro()                set search_path = public, auth, pg_temp;
alter function private.user_es_superadmin()             set search_path = public, auth, pg_temp;
alter function private.user_es_admin_plataforma()       set search_path = public, auth, pg_temp;
alter function private.user_es_admin_global()           set search_path = public, auth, pg_temp;

-- ════════════════════════════════════════════════════════════
-- 3) POLICIES: envolver auth.uid() en (select auth.uid())
--    El (select …) hace que Postgres evalúe una sola vez por query
--    en vez de una vez por fila. Esto puede mejorar listados grandes
--    en órdenes de magnitud.
-- ════════════════════════════════════════════════════════════

-- auditoria
drop policy if exists auditoria_insert on public.auditoria;
create policy auditoria_insert on public.auditoria
  for insert to authenticated
  with check ((user_id = (select auth.uid())) or private.user_es_superadmin());

-- concesion_choferes (read)
drop policy if exists cc_read on public.concesion_choferes;
create policy cc_read on public.concesion_choferes
  for select to authenticated
  using (exists (
    select 1 from public.usuarios_roles ur
    where ur.user_id = (select auth.uid()) and ur.activo = true
  ));

-- concesion_choferes (write)
drop policy if exists cc_write on public.concesion_choferes;
create policy cc_write on public.concesion_choferes
  for all to authenticated
  using (
    private.user_tiene_rol('superadmin')
    or private.user_tiene_rol('sec_general')
    or private.user_tiene_rol('sec_organizacion')
    or exists (
      select 1 from public.concesiones c
      join public.usuarios_perfil up on up.socio_id = c.socio_id
      where c.id = concesion_choferes.concesion_id
        and up.user_id = (select auth.uid())
    )
  )
  with check (
    private.user_tiene_rol('superadmin')
    or private.user_tiene_rol('sec_general')
    or private.user_tiene_rol('sec_organizacion')
    or exists (
      select 1 from public.concesiones c
      join public.usuarios_perfil up on up.socio_id = c.socio_id
      where c.id = concesion_choferes.concesion_id
        and up.user_id = (select auth.uid())
    )
  );

-- impersonaciones (read)
drop policy if exists impersonacion_read on public.impersonaciones;
create policy impersonacion_read on public.impersonaciones
  for select to authenticated
  using (private.user_es_superadmin() or (superadmin_user_id = (select auth.uid())));

-- mensualidades_cuotas (read)
drop policy if exists mc_read on public.mensualidades_cuotas;
create policy mc_read on public.mensualidades_cuotas
  for select to authenticated
  using (
    private.user_tiene_alguno_de(array['sec_general','tesorero','hacienda','sec_organizacion'])
    or (private.user_tiene_rol('delegado') and sitio_id_donde_pago = private.user_sitio_scope())
    or socio_id in (
      select up.socio_id from public.usuarios_perfil up
      where up.user_id = (select auth.uid())
    )
  );

-- usuarios_perfil (insert)
drop policy if exists up_insert on public.usuarios_perfil;
create policy up_insert on public.usuarios_perfil
  for insert to authenticated
  with check (
    (user_id = (select auth.uid()))
    or private.user_tiene_alguno_de(array['sec_general','sec_organizacion'])
  );

-- usuarios_perfil (read)
drop policy if exists up_read on public.usuarios_perfil;
create policy up_read on public.usuarios_perfil
  for select to authenticated
  using (
    (user_id = (select auth.uid()))
    or private.user_tiene_alguno_de(array['sec_general','sec_organizacion'])
  );

-- usuarios_perfil (update)
drop policy if exists up_write_self on public.usuarios_perfil;
create policy up_write_self on public.usuarios_perfil
  for update to authenticated
  using (
    (user_id = (select auth.uid()))
    or private.user_tiene_alguno_de(array['sec_general','sec_organizacion'])
  )
  with check (
    (user_id = (select auth.uid()))
    or private.user_tiene_alguno_de(array['sec_general','sec_organizacion'])
  );

-- usuarios_roles (read)
drop policy if exists ur_read on public.usuarios_roles;
create policy ur_read on public.usuarios_roles
  for select to authenticated
  using (
    (user_id = (select auth.uid()))
    or private.user_tiene_alguno_de(array['sec_general','sec_organizacion'])
  );

-- ════════════════════════════════════════════════════════════
-- 4) ÍNDICES SOBRE FK (cierra unindexed_foreign_keys)
-- ════════════════════════════════════════════════════════════
create index if not exists idx_sitios_delegado_socio_id
  on public.sitios (delegado_socio_id);

create index if not exists idx_socios_created_by_user_id
  on public.socios (created_by_user_id);
create index if not exists idx_socios_updated_by_user_id
  on public.socios (updated_by_user_id);

create index if not exists idx_historial_choferes_asignado_por
  on public.historial_choferes (asignado_por_socio_id);

create index if not exists idx_tesoreria_cortes_autorizado_por
  on public.tesoreria_cortes_caja (autorizado_por_user_id);
create index if not exists idx_tesoreria_cortes_cerrado_por
  on public.tesoreria_cortes_caja (cerrado_por_user_id);

create index if not exists idx_tesoreria_movs_created_by
  on public.tesoreria_movimientos (created_by_user_id);

create index if not exists idx_funerario_servicios_plan
  on public.funerario_servicios (plan_codigo);

create index if not exists idx_bitacora_concesion
  on public.bitacora_accidentes (concesion_id);
create index if not exists idx_bitacora_responsable
  on public.bitacora_accidentes (responsable_socio_id);

create index if not exists idx_asambleas_acta_firmada
  on public.asambleas (acta_firmada_por_user_id);
create index if not exists idx_asambleas_convocatoria_firmada
  on public.asambleas (convocatoria_firmada_por_user_id);

create index if not exists idx_acuerdos_acta
  on public.acuerdos (acta_id);

create index if not exists idx_hyj_consignado_socio
  on public.casos_honor_justicia (consignado_por_socio_id);
create index if not exists idx_hyj_consignado_user
  on public.casos_honor_justicia (consignado_por_user_id);

create index if not exists idx_mens_cobrado_por
  on public.mensualidades_cuotas (cobrado_por_user_id);
create index if not exists idx_mens_concesion
  on public.mensualidades_cuotas (concesion_id);
create index if not exists idx_mens_movimiento
  on public.mensualidades_cuotas (movimiento_id);

create index if not exists idx_usuarios_perfil_socio
  on public.usuarios_perfil (socio_id);

create index if not exists idx_modulos_config_updated_by
  on public.modulos_config (updated_by_user_id);

create index if not exists idx_branding_config_updated_by
  on public.branding_config (updated_by_user_id);

create index if not exists idx_impersonaciones_target
  on public.impersonaciones (target_user_id);

comment on schema public is
  'Migración 042 aplicada: hardening de advisors (vistas invoker, search_path fijo en funciones, RLS optimizado, FK indexadas). Extensiones pg_trgm/btree_gist permanecen en public por estar en uso.';

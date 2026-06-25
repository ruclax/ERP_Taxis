-- ─────────────────────────────────────────────────────────────
-- 045 — Consolidación de políticas RLS PERMISSIVE
-- Cierra el warning `multiple_permissive_policies` del Supabase
-- Advisor reduciendo a UNA política por (tabla, acción).
--
-- Las USING y WITH CHECK de todas las políticas PERMISSIVE
-- previas (read/write/admin_plataforma/superadmin) se fusionan
-- con OR. Funcionalmente equivalente, una sola evaluación por fila.
-- ─────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════
-- actas  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "actas_admin_plataforma" on public."actas";
drop policy if exists "actas_read" on public."actas";
drop policy if exists "actas_write" on public."actas";
drop policy if exists "superadmin_all" on public."actas";

create policy "actas_select_unified" on public."actas"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

create policy "actas_insert_unified" on public."actas"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

create policy "actas_update_unified" on public."actas"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

create policy "actas_delete_unified" on public."actas"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- acuerdos  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "acuerdos_admin_plataforma" on public."acuerdos";
drop policy if exists "acuerdos_read" on public."acuerdos";
drop policy if exists "acuerdos_write" on public."acuerdos";
drop policy if exists "superadmin_all" on public."acuerdos";

create policy "acuerdos_select_unified" on public."acuerdos"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

create policy "acuerdos_insert_unified" on public."acuerdos"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

create policy "acuerdos_update_unified" on public."acuerdos"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

create policy "acuerdos_delete_unified" on public."acuerdos"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- adeudos  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "adeudos_admin_plataforma" on public."adeudos";
drop policy if exists "adeudos_read" on public."adeudos";
drop policy if exists "adeudos_write" on public."adeudos";
drop policy if exists "superadmin_all" on public."adeudos";

create policy "adeudos_select_unified" on public."adeudos"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text, 'hacienda'::text, 'sec_organizacion'::text, 'delegado'::text]))
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_superadmin())
  );

create policy "adeudos_insert_unified" on public."adeudos"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_superadmin())
  );

create policy "adeudos_update_unified" on public."adeudos"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_superadmin())
  );

create policy "adeudos_delete_unified" on public."adeudos"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- antidoping  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "antidoping_admin_plataforma" on public."antidoping";
drop policy if exists "antidoping_read" on public."antidoping";
drop policy if exists "antidoping_write" on public."antidoping";
drop policy if exists "superadmin_all" on public."antidoping";

create policy "antidoping_select_unified" on public."antidoping"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "antidoping_insert_unified" on public."antidoping"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "antidoping_update_unified" on public."antidoping"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "antidoping_delete_unified" on public."antidoping"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- asambleas  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "asambleas_admin_plataforma" on public."asambleas";
drop policy if exists "asambleas_read" on public."asambleas";
drop policy if exists "asambleas_write" on public."asambleas";
drop policy if exists "superadmin_all" on public."asambleas";

create policy "asambleas_select_unified" on public."asambleas"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

create policy "asambleas_insert_unified" on public."asambleas"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

create policy "asambleas_update_unified" on public."asambleas"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

create policy "asambleas_delete_unified" on public."asambleas"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_actas'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- audiencias  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "audiencias_admin_plataforma" on public."audiencias";
drop policy if exists "audiencias_read" on public."audiencias";
drop policy if exists "audiencias_write" on public."audiencias";
drop policy if exists "superadmin_all" on public."audiencias";

create policy "audiencias_select_unified" on public."audiencias"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text]))
    or (private.user_es_superadmin())
  );

create policy "audiencias_insert_unified" on public."audiencias"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text]))
    or (private.user_es_superadmin())
  );

create policy "audiencias_update_unified" on public."audiencias"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text]))
    or (private.user_es_superadmin())
  );

create policy "audiencias_delete_unified" on public."audiencias"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- auditoria  (3 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "auditoria_admin_plataforma" on public."auditoria";
drop policy if exists "auditoria_insert" on public."auditoria";
drop policy if exists "auditoria_read" on public."auditoria";

create policy "auditoria_select_unified" on public."auditoria"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "auditoria_insert_unified" on public."auditoria"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (((user_id = ( SELECT auth.uid() AS uid)) OR private.user_es_superadmin()))
  );

create policy "auditoria_update_unified" on public."auditoria"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
  )
  with check (
    (private.user_es_admin_plataforma())
  );

create policy "auditoria_delete_unified" on public."auditoria"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
  );

-- ══════════════════════════════════════════════════════════
-- bitacora_accidentes  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "ba_read" on public."bitacora_accidentes";
drop policy if exists "ba_write" on public."bitacora_accidentes";
drop policy if exists "bitacora_accidentes_admin_plataforma" on public."bitacora_accidentes";
drop policy if exists "superadmin_all" on public."bitacora_accidentes";

create policy "bitacora_accidentes_select_unified" on public."bitacora_accidentes"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_trabajo'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "bitacora_accidentes_insert_unified" on public."bitacora_accidentes"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_trabajo'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "bitacora_accidentes_update_unified" on public."bitacora_accidentes"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_trabajo'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_trabajo'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "bitacora_accidentes_delete_unified" on public."bitacora_accidentes"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_trabajo'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- branding_config  (3 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "branding_config_admin_plataforma" on public."branding_config";
drop policy if exists "branding_read" on public."branding_config";
drop policy if exists "branding_write" on public."branding_config";

create policy "branding_config_select_unified" on public."branding_config"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (true)
    or (private.user_es_superadmin())
  );

create policy "branding_config_insert_unified" on public."branding_config"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "branding_config_update_unified" on public."branding_config"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "branding_config_delete_unified" on public."branding_config"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- casos_honor_justicia  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "casos_honor_justicia_admin_plataforma" on public."casos_honor_justicia";
drop policy if exists "hyj_read" on public."casos_honor_justicia";
drop policy if exists "hyj_write" on public."casos_honor_justicia";
drop policy if exists "superadmin_all" on public."casos_honor_justicia";

create policy "casos_honor_justicia_select_unified" on public."casos_honor_justicia"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text, 'sec_trabajo'::text, 'sec_organizacion'::text]))
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text]))
    or (private.user_es_superadmin())
  );

create policy "casos_honor_justicia_insert_unified" on public."casos_honor_justicia"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text]))
    or (private.user_es_superadmin())
  );

create policy "casos_honor_justicia_update_unified" on public."casos_honor_justicia"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text]))
    or (private.user_es_superadmin())
  );

create policy "casos_honor_justicia_delete_unified" on public."casos_honor_justicia"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- concesion_choferes  (3 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "cc_read" on public."concesion_choferes";
drop policy if exists "cc_write" on public."concesion_choferes";
drop policy if exists "concesion_choferes_admin_plataforma" on public."concesion_choferes";

create policy "concesion_choferes_select_unified" on public."concesion_choferes"
  for SELECT to authenticated
  using (
    ((EXISTS ( SELECT 1
   FROM usuarios_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.activo = true)))))
    or ((private.user_tiene_rol('superadmin'::text) OR private.user_tiene_rol('sec_general'::text) OR private.user_tiene_rol('sec_organizacion'::text) OR (EXISTS ( SELECT 1
   FROM (concesiones c
     JOIN usuarios_perfil up ON ((up.socio_id = c.socio_id)))
  WHERE ((c.id = concesion_choferes.concesion_id) AND (up.user_id = ( SELECT auth.uid() AS uid)))))))
    or (private.user_es_admin_plataforma())
  );

create policy "concesion_choferes_insert_unified" on public."concesion_choferes"
  for INSERT to authenticated
  with check (
    ((private.user_tiene_rol('superadmin'::text) OR private.user_tiene_rol('sec_general'::text) OR private.user_tiene_rol('sec_organizacion'::text) OR (EXISTS ( SELECT 1
   FROM (concesiones c
     JOIN usuarios_perfil up ON ((up.socio_id = c.socio_id)))
  WHERE ((c.id = concesion_choferes.concesion_id) AND (up.user_id = ( SELECT auth.uid() AS uid)))))))
    or (private.user_es_admin_plataforma())
  );

create policy "concesion_choferes_update_unified" on public."concesion_choferes"
  for UPDATE to authenticated
  using (
    ((private.user_tiene_rol('superadmin'::text) OR private.user_tiene_rol('sec_general'::text) OR private.user_tiene_rol('sec_organizacion'::text) OR (EXISTS ( SELECT 1
   FROM (concesiones c
     JOIN usuarios_perfil up ON ((up.socio_id = c.socio_id)))
  WHERE ((c.id = concesion_choferes.concesion_id) AND (up.user_id = ( SELECT auth.uid() AS uid)))))))
    or (private.user_es_admin_plataforma())
  )
  with check (
    ((private.user_tiene_rol('superadmin'::text) OR private.user_tiene_rol('sec_general'::text) OR private.user_tiene_rol('sec_organizacion'::text) OR (EXISTS ( SELECT 1
   FROM (concesiones c
     JOIN usuarios_perfil up ON ((up.socio_id = c.socio_id)))
  WHERE ((c.id = concesion_choferes.concesion_id) AND (up.user_id = ( SELECT auth.uid() AS uid)))))))
    or (private.user_es_admin_plataforma())
  );

create policy "concesion_choferes_delete_unified" on public."concesion_choferes"
  for DELETE to authenticated
  using (
    ((private.user_tiene_rol('superadmin'::text) OR private.user_tiene_rol('sec_general'::text) OR private.user_tiene_rol('sec_organizacion'::text) OR (EXISTS ( SELECT 1
   FROM (concesiones c
     JOIN usuarios_perfil up ON ((up.socio_id = c.socio_id)))
  WHERE ((c.id = concesion_choferes.concesion_id) AND (up.user_id = ( SELECT auth.uid() AS uid)))))))
    or (private.user_es_admin_plataforma())
  );

-- ══════════════════════════════════════════════════════════
-- concesiones  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "concesiones_admin_plataforma" on public."concesiones";
drop policy if exists "concesiones_read" on public."concesiones";
drop policy if exists "concesiones_write" on public."concesiones";
drop policy if exists "superadmin_all" on public."concesiones";

create policy "concesiones_select_unified" on public."concesiones"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or ((private.user_es_miembro() AND ((NOT private.user_tiene_rol('delegado'::text)) OR (sitio_id = private.user_sitio_scope()))))
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "concesiones_insert_unified" on public."concesiones"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "concesiones_update_unified" on public."concesiones"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "concesiones_delete_unified" on public."concesiones"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- cuotas_catalogo  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "cc_read" on public."cuotas_catalogo";
drop policy if exists "cc_write" on public."cuotas_catalogo";
drop policy if exists "cuotas_catalogo_admin_plataforma" on public."cuotas_catalogo";
drop policy if exists "superadmin_all" on public."cuotas_catalogo";

create policy "cuotas_catalogo_select_unified" on public."cuotas_catalogo"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "cuotas_catalogo_insert_unified" on public."cuotas_catalogo"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "cuotas_catalogo_update_unified" on public."cuotas_catalogo"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "cuotas_catalogo_delete_unified" on public."cuotas_catalogo"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- funerario_inscripciones  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "fi_read" on public."funerario_inscripciones";
drop policy if exists "fi_write" on public."funerario_inscripciones";
drop policy if exists "funerario_inscripciones_admin_plataforma" on public."funerario_inscripciones";
drop policy if exists "superadmin_all" on public."funerario_inscripciones";

create policy "funerario_inscripciones_select_unified" on public."funerario_inscripciones"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "funerario_inscripciones_insert_unified" on public."funerario_inscripciones"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "funerario_inscripciones_update_unified" on public."funerario_inscripciones"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "funerario_inscripciones_delete_unified" on public."funerario_inscripciones"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- funerario_planes_catalogo  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "fpc_read" on public."funerario_planes_catalogo";
drop policy if exists "fpc_write" on public."funerario_planes_catalogo";
drop policy if exists "funerario_planes_catalogo_admin_plataforma" on public."funerario_planes_catalogo";
drop policy if exists "superadmin_all" on public."funerario_planes_catalogo";

create policy "funerario_planes_catalogo_select_unified" on public."funerario_planes_catalogo"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "funerario_planes_catalogo_insert_unified" on public."funerario_planes_catalogo"
  for INSERT to authenticated
  with check (
    (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "funerario_planes_catalogo_update_unified" on public."funerario_planes_catalogo"
  for UPDATE to authenticated
  using (
    (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "funerario_planes_catalogo_delete_unified" on public."funerario_planes_catalogo"
  for DELETE to authenticated
  using (
    (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- funerario_servicios  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "fs_read" on public."funerario_servicios";
drop policy if exists "fs_write" on public."funerario_servicios";
drop policy if exists "funerario_servicios_admin_plataforma" on public."funerario_servicios";
drop policy if exists "superadmin_all" on public."funerario_servicios";

create policy "funerario_servicios_select_unified" on public."funerario_servicios"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "funerario_servicios_insert_unified" on public."funerario_servicios"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "funerario_servicios_update_unified" on public."funerario_servicios"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "funerario_servicios_delete_unified" on public."funerario_servicios"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- historial_choferes  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "hc_read" on public."historial_choferes";
drop policy if exists "hc_write" on public."historial_choferes";
drop policy if exists "historial_choferes_admin_plataforma" on public."historial_choferes";
drop policy if exists "superadmin_all" on public."historial_choferes";

create policy "historial_choferes_select_unified" on public."historial_choferes"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "historial_choferes_insert_unified" on public."historial_choferes"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "historial_choferes_update_unified" on public."historial_choferes"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "historial_choferes_delete_unified" on public."historial_choferes"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- impersonaciones  (2 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "impersonacion_read" on public."impersonaciones";
drop policy if exists "impersonacion_write" on public."impersonaciones";

create policy "impersonaciones_select_unified" on public."impersonaciones"
  for SELECT to authenticated
  using (
    ((private.user_es_superadmin() OR (superadmin_user_id = ( SELECT auth.uid() AS uid))))
    or (private.user_es_superadmin())
  );

create policy "impersonaciones_insert_unified" on public."impersonaciones"
  for INSERT to authenticated
  with check (
    (private.user_es_superadmin())
  );

create policy "impersonaciones_update_unified" on public."impersonaciones"
  for UPDATE to authenticated
  using (
    (private.user_es_superadmin())
  )
  with check (
    (private.user_es_superadmin())
  );

create policy "impersonaciones_delete_unified" on public."impersonaciones"
  for DELETE to authenticated
  using (
    (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- mensualidades_cuotas  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "mc_read" on public."mensualidades_cuotas";
drop policy if exists "mc_write" on public."mensualidades_cuotas";
drop policy if exists "mensualidades_cuotas_admin_plataforma" on public."mensualidades_cuotas";
drop policy if exists "superadmin_all" on public."mensualidades_cuotas";

create policy "mensualidades_cuotas_select_unified" on public."mensualidades_cuotas"
  for SELECT to authenticated
  using (
    ((private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text, 'hacienda'::text, 'sec_organizacion'::text]) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id_donde_pago = private.user_sitio_scope())) OR (socio_id IN ( SELECT up.socio_id
   FROM usuarios_perfil up
  WHERE (up.user_id = ( SELECT auth.uid() AS uid))))))
    or ((private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id_donde_pago = private.user_sitio_scope()))))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "mensualidades_cuotas_insert_unified" on public."mensualidades_cuotas"
  for INSERT to authenticated
  with check (
    ((private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id_donde_pago = private.user_sitio_scope()))))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "mensualidades_cuotas_update_unified" on public."mensualidades_cuotas"
  for UPDATE to authenticated
  using (
    ((private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id_donde_pago = private.user_sitio_scope()))))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    ((private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id_donde_pago = private.user_sitio_scope()))))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "mensualidades_cuotas_delete_unified" on public."mensualidades_cuotas"
  for DELETE to authenticated
  using (
    ((private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id_donde_pago = private.user_sitio_scope()))))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- modulos_config  (3 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "modulos_config_admin_plataforma" on public."modulos_config";
drop policy if exists "modulos_config_read" on public."modulos_config";
drop policy if exists "modulos_config_write" on public."modulos_config";

create policy "modulos_config_select_unified" on public."modulos_config"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (true)
    or (private.user_es_superadmin())
  );

create policy "modulos_config_insert_unified" on public."modulos_config"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "modulos_config_update_unified" on public."modulos_config"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "modulos_config_delete_unified" on public."modulos_config"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- polizas  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "polizas_admin_plataforma" on public."polizas";
drop policy if exists "polizas_read" on public."polizas";
drop policy if exists "polizas_write" on public."polizas";
drop policy if exists "superadmin_all" on public."polizas";

create policy "polizas_select_unified" on public."polizas"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "polizas_insert_unified" on public."polizas"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "polizas_update_unified" on public."polizas"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "polizas_delete_unified" on public."polizas"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- revistas_vehiculares  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "revistas_read" on public."revistas_vehiculares";
drop policy if exists "revistas_vehiculares_admin_plataforma" on public."revistas_vehiculares";
drop policy if exists "revistas_write" on public."revistas_vehiculares";
drop policy if exists "superadmin_all" on public."revistas_vehiculares";

create policy "revistas_vehiculares_select_unified" on public."revistas_vehiculares"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "revistas_vehiculares_insert_unified" on public."revistas_vehiculares"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "revistas_vehiculares_update_unified" on public."revistas_vehiculares"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "revistas_vehiculares_delete_unified" on public."revistas_vehiculares"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- roles  (3 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "roles_read" on public."roles";
drop policy if exists "roles_write" on public."roles";
drop policy if exists "superadmin_all" on public."roles";

create policy "roles_select_unified" on public."roles"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_superadmin())
  );

create policy "roles_insert_unified" on public."roles"
  for INSERT to authenticated
  with check (
    (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_superadmin())
  );

create policy "roles_update_unified" on public."roles"
  for UPDATE to authenticated
  using (
    (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_superadmin())
  );

create policy "roles_delete_unified" on public."roles"
  for DELETE to authenticated
  using (
    (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- sanciones_sitio  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "sanciones_sitio_admin_plataforma" on public."sanciones_sitio";
drop policy if exists "ss_read" on public."sanciones_sitio";
drop policy if exists "ss_write_delegado" on public."sanciones_sitio";
drop policy if exists "superadmin_all" on public."sanciones_sitio";

create policy "sanciones_sitio_select_unified" on public."sanciones_sitio"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or ((private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'honor_justicia'::text, 'sec_trabajo'::text]) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id = private.user_sitio_scope()))))
    or ((private.user_tiene_rol('sec_general'::text) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id = private.user_sitio_scope()))))
    or (private.user_es_superadmin())
  );

create policy "sanciones_sitio_insert_unified" on public."sanciones_sitio"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or ((private.user_tiene_rol('sec_general'::text) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id = private.user_sitio_scope()))))
    or (private.user_es_superadmin())
  );

create policy "sanciones_sitio_update_unified" on public."sanciones_sitio"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or ((private.user_tiene_rol('sec_general'::text) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id = private.user_sitio_scope()))))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or ((private.user_tiene_rol('sec_general'::text) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id = private.user_sitio_scope()))))
    or (private.user_es_superadmin())
  );

create policy "sanciones_sitio_delete_unified" on public."sanciones_sitio"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or ((private.user_tiene_rol('sec_general'::text) OR (private.user_tiene_rol('delegado'::text) AND (sitio_id = private.user_sitio_scope()))))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- sitios  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "sitios_admin_plataforma" on public."sitios";
drop policy if exists "sitios_read" on public."sitios";
drop policy if exists "sitios_write" on public."sitios";
drop policy if exists "superadmin_all" on public."sitios";

create policy "sitios_select_unified" on public."sitios"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "sitios_insert_unified" on public."sitios"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "sitios_update_unified" on public."sitios"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "sitios_delete_unified" on public."sitios"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- socios  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "socios_admin_plataforma" on public."socios";
drop policy if exists "socios_read" on public."socios";
drop policy if exists "socios_write" on public."socios";
drop policy if exists "superadmin_all" on public."socios";

create policy "socios_select_unified" on public."socios"
  for SELECT to authenticated
  using (
    (private.user_es_admin_plataforma())
    or ((private.user_es_miembro() AND ((NOT private.user_tiene_rol('delegado'::text)) OR (EXISTS ( SELECT 1
   FROM concesiones c
  WHERE ((c.socio_id = socios.id) AND (c.sitio_id = private.user_sitio_scope())))))))
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "socios_insert_unified" on public."socios"
  for INSERT to authenticated
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "socios_update_unified" on public."socios"
  for UPDATE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

create policy "socios_delete_unified" on public."socios"
  for DELETE to authenticated
  using (
    (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- socios_beneficiarios  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "sb_read" on public."socios_beneficiarios";
drop policy if exists "sb_write" on public."socios_beneficiarios";
drop policy if exists "socios_beneficiarios_admin_plataforma" on public."socios_beneficiarios";
drop policy if exists "superadmin_all" on public."socios_beneficiarios";

create policy "socios_beneficiarios_select_unified" on public."socios_beneficiarios"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_beneficiarios_insert_unified" on public."socios_beneficiarios"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_beneficiarios_update_unified" on public."socios_beneficiarios"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_beneficiarios_delete_unified" on public."socios_beneficiarios"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- socios_contactos  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "sc_read" on public."socios_contactos";
drop policy if exists "sc_write" on public."socios_contactos";
drop policy if exists "socios_contactos_admin_plataforma" on public."socios_contactos";
drop policy if exists "superadmin_all" on public."socios_contactos";

create policy "socios_contactos_select_unified" on public."socios_contactos"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_contactos_insert_unified" on public."socios_contactos"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_contactos_update_unified" on public."socios_contactos"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_contactos_delete_unified" on public."socios_contactos"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- socios_credencial_elector  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "sce_read" on public."socios_credencial_elector";
drop policy if exists "sce_write" on public."socios_credencial_elector";
drop policy if exists "socios_credencial_elector_admin_plataforma" on public."socios_credencial_elector";
drop policy if exists "superadmin_all" on public."socios_credencial_elector";

create policy "socios_credencial_elector_select_unified" on public."socios_credencial_elector"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_credencial_elector_insert_unified" on public."socios_credencial_elector"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_credencial_elector_update_unified" on public."socios_credencial_elector"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_credencial_elector_delete_unified" on public."socios_credencial_elector"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- socios_direcciones  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "sd_read" on public."socios_direcciones";
drop policy if exists "sd_write" on public."socios_direcciones";
drop policy if exists "socios_direcciones_admin_plataforma" on public."socios_direcciones";
drop policy if exists "superadmin_all" on public."socios_direcciones";

create policy "socios_direcciones_select_unified" on public."socios_direcciones"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_direcciones_insert_unified" on public."socios_direcciones"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_direcciones_update_unified" on public."socios_direcciones"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_direcciones_delete_unified" on public."socios_direcciones"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- socios_licencia_conducir  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "slc_read" on public."socios_licencia_conducir";
drop policy if exists "slc_write" on public."socios_licencia_conducir";
drop policy if exists "socios_licencia_conducir_admin_plataforma" on public."socios_licencia_conducir";
drop policy if exists "superadmin_all" on public."socios_licencia_conducir";

create policy "socios_licencia_conducir_select_unified" on public."socios_licencia_conducir"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_licencia_conducir_insert_unified" on public."socios_licencia_conducir"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_licencia_conducir_update_unified" on public."socios_licencia_conducir"
  for UPDATE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  )
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_licencia_conducir_delete_unified" on public."socios_licencia_conducir"
  for DELETE to authenticated
  using (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- tesoreria_cortes_caja  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "superadmin_all" on public."tesoreria_cortes_caja";
drop policy if exists "tcc_read" on public."tesoreria_cortes_caja";
drop policy if exists "tcc_write_tesorero" on public."tesoreria_cortes_caja";
drop policy if exists "tesoreria_cortes_caja_admin_plataforma" on public."tesoreria_cortes_caja";

create policy "tesoreria_cortes_caja_select_unified" on public."tesoreria_cortes_caja"
  for SELECT to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text, 'hacienda'::text]))
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
  );

create policy "tesoreria_cortes_caja_insert_unified" on public."tesoreria_cortes_caja"
  for INSERT to authenticated
  with check (
    (private.user_es_superadmin())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
  );

create policy "tesoreria_cortes_caja_update_unified" on public."tesoreria_cortes_caja"
  for UPDATE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
  )
  with check (
    (private.user_es_superadmin())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
  );

create policy "tesoreria_cortes_caja_delete_unified" on public."tesoreria_cortes_caja"
  for DELETE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
    or (private.user_es_admin_plataforma())
  );

-- ══════════════════════════════════════════════════════════
-- tesoreria_movimientos  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "superadmin_all" on public."tesoreria_movimientos";
drop policy if exists "tesoreria_movimientos_admin_plataforma" on public."tesoreria_movimientos";
drop policy if exists "tm_read" on public."tesoreria_movimientos";
drop policy if exists "tm_write" on public."tesoreria_movimientos";

create policy "tesoreria_movimientos_select_unified" on public."tesoreria_movimientos"
  for SELECT to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text, 'hacienda'::text]))
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
  );

create policy "tesoreria_movimientos_insert_unified" on public."tesoreria_movimientos"
  for INSERT to authenticated
  with check (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
  );

create policy "tesoreria_movimientos_update_unified" on public."tesoreria_movimientos"
  for UPDATE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
  )
  with check (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
  );

create policy "tesoreria_movimientos_delete_unified" on public."tesoreria_movimientos"
  for DELETE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'tesorero'::text]))
  );

-- ══════════════════════════════════════════════════════════
-- usuarios_perfil  (5 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "superadmin_all" on public."usuarios_perfil";
drop policy if exists "up_insert" on public."usuarios_perfil";
drop policy if exists "up_read" on public."usuarios_perfil";
drop policy if exists "up_write_self" on public."usuarios_perfil";
drop policy if exists "usuarios_perfil_admin_plataforma" on public."usuarios_perfil";

create policy "usuarios_perfil_select_unified" on public."usuarios_perfil"
  for SELECT to authenticated
  using (
    (private.user_es_superadmin())
    or (((user_id = ( SELECT auth.uid() AS uid)) OR private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])))
    or (private.user_es_admin_plataforma())
  );

create policy "usuarios_perfil_insert_unified" on public."usuarios_perfil"
  for INSERT to authenticated
  with check (
    (private.user_es_superadmin())
    or (((user_id = ( SELECT auth.uid() AS uid)) OR private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])))
    or (private.user_es_admin_plataforma())
  );

create policy "usuarios_perfil_update_unified" on public."usuarios_perfil"
  for UPDATE to authenticated
  using (
    (private.user_es_superadmin())
    or (((user_id = ( SELECT auth.uid() AS uid)) OR private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])))
    or (private.user_es_admin_plataforma())
  )
  with check (
    (private.user_es_superadmin())
    or (((user_id = ( SELECT auth.uid() AS uid)) OR private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])))
    or (private.user_es_admin_plataforma())
  );

create policy "usuarios_perfil_delete_unified" on public."usuarios_perfil"
  for DELETE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
  );

-- ══════════════════════════════════════════════════════════
-- usuarios_roles  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "superadmin_all" on public."usuarios_roles";
drop policy if exists "ur_read" on public."usuarios_roles";
drop policy if exists "ur_write" on public."usuarios_roles";
drop policy if exists "usuarios_roles_admin_plataforma" on public."usuarios_roles";

create policy "usuarios_roles_select_unified" on public."usuarios_roles"
  for SELECT to authenticated
  using (
    (private.user_es_superadmin())
    or (((user_id = ( SELECT auth.uid() AS uid)) OR private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text])))
    or (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_admin_plataforma())
  );

create policy "usuarios_roles_insert_unified" on public."usuarios_roles"
  for INSERT to authenticated
  with check (
    (private.user_es_superadmin())
    or (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_admin_plataforma())
  );

create policy "usuarios_roles_update_unified" on public."usuarios_roles"
  for UPDATE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_admin_plataforma())
  )
  with check (
    (private.user_es_superadmin())
    or (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_admin_plataforma())
  );

create policy "usuarios_roles_delete_unified" on public."usuarios_roles"
  for DELETE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_tiene_rol('sec_general'::text))
    or (private.user_es_admin_plataforma())
  );

-- ══════════════════════════════════════════════════════════
-- vehiculo_asignaciones  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "superadmin_all" on public."vehiculo_asignaciones";
drop policy if exists "va_read" on public."vehiculo_asignaciones";
drop policy if exists "va_write" on public."vehiculo_asignaciones";
drop policy if exists "vehiculo_asignaciones_admin_plataforma" on public."vehiculo_asignaciones";

create policy "vehiculo_asignaciones_select_unified" on public."vehiculo_asignaciones"
  for SELECT to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
  );

create policy "vehiculo_asignaciones_insert_unified" on public."vehiculo_asignaciones"
  for INSERT to authenticated
  with check (
    (private.user_es_superadmin())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
  );

create policy "vehiculo_asignaciones_update_unified" on public."vehiculo_asignaciones"
  for UPDATE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
  )
  with check (
    (private.user_es_superadmin())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
  );

create policy "vehiculo_asignaciones_delete_unified" on public."vehiculo_asignaciones"
  for DELETE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
  );

-- ══════════════════════════════════════════════════════════
-- vehiculos  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "superadmin_all" on public."vehiculos";
drop policy if exists "vehiculos_admin_plataforma" on public."vehiculos";
drop policy if exists "vehiculos_read" on public."vehiculos";
drop policy if exists "vehiculos_write" on public."vehiculos";

create policy "vehiculos_select_unified" on public."vehiculos"
  for SELECT to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
  );

create policy "vehiculos_insert_unified" on public."vehiculos"
  for INSERT to authenticated
  with check (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
  );

create policy "vehiculos_update_unified" on public."vehiculos"
  for UPDATE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
  )
  with check (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
  );

create policy "vehiculos_delete_unified" on public."vehiculos"
  for DELETE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
  );

-- ══════════════════════════════════════════════════════════
-- vehiculos_fuera_sindicato_notas  (4 políticas previas)
-- ══════════════════════════════════════════════════════════
drop policy if exists "superadmin_all" on public."vehiculos_fuera_sindicato_notas";
drop policy if exists "vehiculos_fuera_sindicato_notas_admin_plataforma" on public."vehiculos_fuera_sindicato_notas";
drop policy if exists "vfsn_read" on public."vehiculos_fuera_sindicato_notas";
drop policy if exists "vfsn_write" on public."vehiculos_fuera_sindicato_notas";

create policy "vehiculos_fuera_sindicato_notas_select_unified" on public."vehiculos_fuera_sindicato_notas"
  for SELECT to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
  );

create policy "vehiculos_fuera_sindicato_notas_insert_unified" on public."vehiculos_fuera_sindicato_notas"
  for INSERT to authenticated
  with check (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
  );

create policy "vehiculos_fuera_sindicato_notas_update_unified" on public."vehiculos_fuera_sindicato_notas"
  for UPDATE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
  )
  with check (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
  );

create policy "vehiculos_fuera_sindicato_notas_delete_unified" on public."vehiculos_fuera_sindicato_notas"
  for DELETE to authenticated
  using (
    (private.user_es_superadmin())
    or (private.user_es_admin_plataforma())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
  );

-- ── Resumen ──
-- 146 políticas eliminadas, 152 políticas consolidadas creadas.
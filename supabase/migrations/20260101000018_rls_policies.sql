-- ─────────────────────────────────────────────────────────────
-- 018 — Row Level Security (RLS)
-- Policies derivadas de acciones-por-rol.jsx del prototipo
-- ─────────────────────────────────────────────────────────────

-- Activar RLS en todas las tablas del schema public
alter table sitios                          enable row level security;
alter table socios                          enable row level security;
alter table socios_direcciones              enable row level security;
alter table socios_contactos                enable row level security;
alter table socios_beneficiarios            enable row level security;
alter table socios_credencial_elector       enable row level security;
alter table socios_licencia_conducir        enable row level security;
alter table concesiones                     enable row level security;
alter table vehiculos                       enable row level security;
alter table vehiculo_asignaciones           enable row level security;
alter table polizas                         enable row level security;
alter table antidoping                      enable row level security;
alter table revistas_vehiculares            enable row level security;
alter table historial_choferes              enable row level security;
alter table tesoreria_cortes_caja           enable row level security;
alter table tesoreria_movimientos           enable row level security;
alter table adeudos                         enable row level security;
alter table funerario_planes_catalogo       enable row level security;
alter table funerario_inscripciones         enable row level security;
alter table funerario_servicios             enable row level security;
alter table bitacora_accidentes             enable row level security;
alter table asambleas                       enable row level security;
alter table actas                           enable row level security;
alter table acuerdos                        enable row level security;
alter table casos_honor_justicia            enable row level security;
alter table audiencias                      enable row level security;
alter table sanciones_sitio                 enable row level security;
alter table cuotas_catalogo                 enable row level security;
alter table mensualidades_cuotas            enable row level security;
alter table vehiculos_fuera_sindicato_notas enable row level security;
alter table roles                           enable row level security;
alter table usuarios_perfil                 enable row level security;
alter table usuarios_roles                  enable row level security;

-- ═══════════════════════════════════════════════════════════
-- LECTURA: todos los autenticados con rol activo pueden ver
-- (con filtro por scope para delegado de sitio)
-- ═══════════════════════════════════════════════════════════

-- Helper macro: lectura general para miembros
-- Sitios: todos pueden leer
create policy sitios_read on sitios for select to authenticated
  using (private.user_es_miembro());

-- Socios: todos los autenticados leen; delegado solo los de su sitio
create policy socios_read on socios for select to authenticated
  using (
    private.user_es_miembro() and (
      not private.user_tiene_rol('delegado')
      or exists (
        select 1 from concesiones c
        where c.socio_id = socios.id and c.sitio_id = private.user_sitio_scope()
      )
    )
  );

-- Documentos del socio: heredan acceso del socio
create policy sd_read on socios_direcciones for select to authenticated using (private.user_es_miembro());
create policy sc_read on socios_contactos for select to authenticated using (private.user_es_miembro());
create policy sb_read on socios_beneficiarios for select to authenticated using (private.user_es_miembro());
create policy sce_read on socios_credencial_elector for select to authenticated using (private.user_es_miembro());
create policy slc_read on socios_licencia_conducir for select to authenticated using (private.user_es_miembro());

-- Concesiones, vehículos, pólizas
create policy concesiones_read on concesiones for select to authenticated
  using (
    private.user_es_miembro() and (
      not private.user_tiene_rol('delegado')
      or sitio_id = private.user_sitio_scope()
    )
  );

create policy vehiculos_read on vehiculos for select to authenticated using (private.user_es_miembro());
create policy va_read on vehiculo_asignaciones for select to authenticated using (private.user_es_miembro());
create policy polizas_read on polizas for select to authenticated using (private.user_es_miembro());
create policy antidoping_read on antidoping for select to authenticated using (private.user_es_miembro());
create policy revistas_read on revistas_vehiculares for select to authenticated using (private.user_es_miembro());
create policy hc_read on historial_choferes for select to authenticated using (private.user_es_miembro());

-- Tesorería: lectura para tesorero, sec_general, hacienda (auditoría)
create policy tcc_read on tesoreria_cortes_caja for select to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','tesorero','hacienda']));

create policy tm_read on tesoreria_movimientos for select to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','tesorero','hacienda']));

create policy adeudos_read on adeudos for select to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','tesorero','hacienda','sec_organizacion','delegado']));

-- Funerario
create policy fpc_read on funerario_planes_catalogo for select to authenticated using (private.user_es_miembro());
create policy fi_read on funerario_inscripciones for select to authenticated using (private.user_es_miembro());
create policy fs_read on funerario_servicios for select to authenticated using (private.user_es_miembro());

-- Bitácora
create policy ba_read on bitacora_accidentes for select to authenticated using (private.user_es_miembro());

-- Asambleas, actas, acuerdos
create policy asambleas_read on asambleas for select to authenticated using (private.user_es_miembro());
create policy actas_read on actas for select to authenticated using (private.user_es_miembro());
create policy acuerdos_read on acuerdos for select to authenticated using (private.user_es_miembro());

-- Honor y Justicia
create policy hyj_read on casos_honor_justicia for select to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','honor_justicia','sec_trabajo','sec_organizacion']));

create policy audiencias_read on audiencias for select to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','honor_justicia']));

-- Sanciones
create policy ss_read on sanciones_sitio for select to authenticated
  using (
    private.user_tiene_alguno_de(array['sec_general','honor_justicia','sec_trabajo'])
    or (private.user_tiene_rol('delegado') and sitio_id = private.user_sitio_scope())
  );

-- Cuotas y mensualidades
create policy cc_read on cuotas_catalogo for select to authenticated using (private.user_es_miembro());
create policy mc_read on mensualidades_cuotas for select to authenticated
  using (
    private.user_tiene_alguno_de(array['sec_general','tesorero','hacienda','sec_organizacion'])
    or (private.user_tiene_rol('delegado') and sitio_id_donde_pago = private.user_sitio_scope())
    or socio_id in (select socio_id from usuarios_perfil where user_id = auth.uid())
  );

-- Vehículos fuera del sindicato
create policy vfsn_read on vehiculos_fuera_sindicato_notas for select to authenticated using (private.user_es_miembro());

-- Roles y usuarios: lectura limitada
create policy roles_read on roles for select to authenticated using (private.user_es_miembro());
create policy up_read on usuarios_perfil for select to authenticated
  using (
    user_id = auth.uid()
    or private.user_tiene_alguno_de(array['sec_general','sec_organizacion'])
  );
create policy ur_read on usuarios_roles for select to authenticated
  using (
    user_id = auth.uid()
    or private.user_tiene_alguno_de(array['sec_general','sec_organizacion'])
  );

-- ═══════════════════════════════════════════════════════════
-- ESCRITURA: solo roles autorizados
-- (matriz extraída de acciones-por-rol.jsx)
-- ═══════════════════════════════════════════════════════════

-- Padrón / Socios → sec_general, sec_organizacion
create policy socios_write on socios for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy sd_write on socios_direcciones for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy sc_write on socios_contactos for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy sb_write on socios_beneficiarios for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy sce_write on socios_credencial_elector for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy slc_write on socios_licencia_conducir for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy sitios_write on sitios for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

-- Concesiones y vehículos
create policy concesiones_write on concesiones for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy vehiculos_write on vehiculos for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy va_write on vehiculo_asignaciones for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy hc_write on historial_choferes for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

-- Pólizas → sec_general, tesorero, sec_organizacion
create policy polizas_write on polizas for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','tesorero','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','tesorero','sec_organizacion']));

-- Antidoping y revistas → sec_organizacion
create policy antidoping_write on antidoping for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy revistas_write on revistas_vehiculares for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

-- Tesorería → solo tesorero (sec_general autoriza cortes)
create policy tcc_write_tesorero on tesoreria_cortes_caja for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','tesorero']))
  with check (private.user_tiene_alguno_de(array['sec_general','tesorero']));

create policy tm_write on tesoreria_movimientos for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','tesorero']))
  with check (private.user_tiene_alguno_de(array['sec_general','tesorero']));

create policy adeudos_write on adeudos for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','tesorero']))
  with check (private.user_tiene_alguno_de(array['sec_general','tesorero']));

-- Funerario → tesorero + sec_general
create policy fi_write on funerario_inscripciones for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','tesorero']))
  with check (private.user_tiene_alguno_de(array['sec_general','tesorero']));

create policy fs_write on funerario_servicios for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','tesorero']))
  with check (private.user_tiene_alguno_de(array['sec_general','tesorero']));

create policy fpc_write on funerario_planes_catalogo for all to authenticated
  using (private.user_tiene_rol('sec_general'))
  with check (private.user_tiene_rol('sec_general'));

-- Bitácora → sec_trabajo (área), tesorero (liquidación), sec_general
create policy ba_write on bitacora_accidentes for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_trabajo','tesorero']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_trabajo','tesorero']));

-- Asambleas / actas / acuerdos → sec_actas + sec_general
create policy asambleas_write on asambleas for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_actas']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_actas']));

create policy actas_write on actas for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_actas']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_actas']));

create policy acuerdos_write on acuerdos for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_actas']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_actas']));

-- Honor y Justicia → comisión + sec_general
create policy hyj_write on casos_honor_justicia for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','honor_justicia']))
  with check (private.user_tiene_alguno_de(array['sec_general','honor_justicia']));

create policy audiencias_write on audiencias for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','honor_justicia']))
  with check (private.user_tiene_alguno_de(array['sec_general','honor_justicia']));

-- Sanciones → delegado (su sitio) + sec_general
create policy ss_write_delegado on sanciones_sitio for all to authenticated
  using (
    private.user_tiene_rol('sec_general')
    or (private.user_tiene_rol('delegado') and sitio_id = private.user_sitio_scope())
  )
  with check (
    private.user_tiene_rol('sec_general')
    or (private.user_tiene_rol('delegado') and sitio_id = private.user_sitio_scope())
  );

-- Mensualidades → tesorero + delegado (cobra en su sitio) + sec_general
create policy mc_write on mensualidades_cuotas for all to authenticated
  using (
    private.user_tiene_alguno_de(array['sec_general','tesorero'])
    or (private.user_tiene_rol('delegado') and sitio_id_donde_pago = private.user_sitio_scope())
  )
  with check (
    private.user_tiene_alguno_de(array['sec_general','tesorero'])
    or (private.user_tiene_rol('delegado') and sitio_id_donde_pago = private.user_sitio_scope())
  );

create policy cc_write on cuotas_catalogo for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','tesorero']))
  with check (private.user_tiene_alguno_de(array['sec_general','tesorero']));

create policy vfsn_write on vehiculos_fuera_sindicato_notas for all to authenticated
  using (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

-- ═══════════════════════════════════════════════════════════
-- Administración de roles (solo sec_general)
-- ═══════════════════════════════════════════════════════════

create policy roles_write on roles for all to authenticated
  using (private.user_tiene_rol('sec_general'))
  with check (private.user_tiene_rol('sec_general'));

create policy ur_write on usuarios_roles for all to authenticated
  using (private.user_tiene_rol('sec_general'))
  with check (private.user_tiene_rol('sec_general'));

-- Perfil propio: cada usuario edita el suyo + sec_general/sec_organizacion editan cualquiera
create policy up_write_self on usuarios_perfil for update to authenticated
  using (user_id = auth.uid() or private.user_tiene_alguno_de(array['sec_general','sec_organizacion']))
  with check (user_id = auth.uid() or private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

create policy up_insert on usuarios_perfil for insert to authenticated
  with check (user_id = auth.uid() or private.user_tiene_alguno_de(array['sec_general','sec_organizacion']));

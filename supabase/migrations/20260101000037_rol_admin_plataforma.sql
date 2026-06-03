-- ─────────────────────────────────────────────────────────────
-- 037 — Formalización de roles "extra-electivos":
--   • superadmin       — desarrollador de la plataforma (no requiere ser agremiado)
--   • admin_plataforma — operador contratado por el sindicato (NO requiere ser
--                         agremiado, pero si lo es, queda vinculado a su socio_id)
--
-- Los 8 roles del comité (sec_general, sec_organizacion, tesorero, sec_actas,
-- sec_trabajo, honor_justicia, hacienda, delegado) siguen siendo electos por
-- asamblea y obligan a ser agremiados.
--
-- Esta política es decisión humana — no se enforza con constraints SQL.
-- ─────────────────────────────────────────────────────────────

insert into public.roles (codigo, nombre, descripcion, scope_tipo, modulos_acceso, solo_lectura, orden_jerarquia)
values
  ('superadmin', 'Super Administrador (Desarrollador)',
   'Rol exclusivo del desarrollador de la plataforma. Acceso god-mode a todas las tablas, bypasea RLS vía service_role. NO requiere ser agremiado.',
   'GLOBAL',
   '["mipanel","dashboard","padron","flota","choferes","polizas","funerario","tesoreria","bitacora","asambleas","honor"]'::jsonb,
   false, 0),

  ('admin_plataforma', 'Administrador de Plataforma',
   'Operador contratado por el sindicato para administrar, configurar y mantener al día la plataforma. Tiene acceso de lectura y escritura a todos los módulos. Cada acción queda registrada en la tabla `auditoria`. Convocatorias, notificaciones y actualización de datos sensibles son su responsabilidad cotidiana. NO requiere ser agremiado.',
   'GLOBAL',
   '["mipanel","dashboard","padron","flota","choferes","polizas","funerario","tesoreria","bitacora","asambleas","honor"]'::jsonb,
   false, 1)

on conflict (codigo) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  modulos_acceso = excluded.modulos_acceso,
  solo_lectura = excluded.solo_lectura,
  orden_jerarquia = excluded.orden_jerarquia;

comment on table public.roles is
  'Catálogo de roles del sistema. Los 8 electos (sec_general...delegado) requieren ser agremiado; superadmin y admin_plataforma no.';

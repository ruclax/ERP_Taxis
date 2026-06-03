'use server';

import { createSupabaseServiceRole, getSuperadminUserOrRedirect } from '@/lib/supabase-server';

async function auth() {
  const { user, isAdmin } = await getSuperadminUserOrRedirect();
  if (!user || !isAdmin) throw new Error('No autorizado');
  return user;
}

const TABLAS = [
  'sitios', 'socios', 'concesiones', 'vehiculos', 'polizas',
  'socios_direcciones', 'socios_contactos', 'socios_beneficiarios',
  'socios_credencial_elector', 'socios_licencia_conducir',
  'antidoping', 'historial_choferes', 'bitacora_accidentes',
  'tesoreria_movimientos', 'adeudos', 'mensualidades_cuotas',
  'sanciones_sitio', 'asambleas', 'actas', 'acuerdos',
  'casos_honor_justicia', 'audiencias',
  'funerario_inscripciones', 'funerario_servicios',
  'roles', 'usuarios_perfil', 'usuarios_roles',
  'modulos_config', 'branding_config',
];

export async function exportarTabla(tabla: string): Promise<{ ok: true; rows: unknown[]; columns: string[] } | { ok: false; error: string }> {
  await auth();
  if (!TABLAS.includes(tabla)) return { ok: false, error: 'Tabla no permitida' };
  const svc = createSupabaseServiceRole();
  // tabla ya está validado contra la whitelist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (svc.from as (t: string) => any)(tabla).select('*').limit(50000);
  if (error) return { ok: false, error: error.message };
  const cols = data && data.length > 0 ? Object.keys(data[0]) : [];

  await svc.from('auditoria').insert({
    user_id: (await auth()).id,
    user_email: (await auth()).email,
    rol_activo: 'superadmin',
    accion: 'EXPORT_TABLE',
    entidad: tabla,
    entidad_id: tabla,
    valor_despues: { rows: data?.length ?? 0 },
  });

  return { ok: true, rows: data ?? [], columns: cols };
}

export async function listarTablas() {
  return TABLAS;
}

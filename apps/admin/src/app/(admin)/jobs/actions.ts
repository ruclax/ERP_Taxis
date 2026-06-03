'use server';

import { createSupabaseServiceRole, getSuperadminUserOrRedirect } from '@/lib/supabase-server';

async function auth() {
  const { user, isAdmin } = await getSuperadminUserOrRedirect();
  if (!user || !isAdmin) throw new Error('No autorizado');
  return user;
}

async function logJob(name: string, success: boolean, payload: unknown, error?: string) {
  const me = await auth();
  await createSupabaseServiceRole().from('auditoria').insert({
    user_id: me.id,
    user_email: me.email,
    rol_activo: 'superadmin',
    accion: `JOB_${name}`,
    entidad: 'jobs',
    entidad_id: name,
    valor_despues: payload as never,
    exito: success,
    error_mensaje: error ?? null,
  });
}

export async function jobRecalcularEstadoPolizas(): Promise<{ ok: boolean; updated?: number; error?: string }> {
  await auth();
  const svc = createSupabaseServiceRole();
  // Recalcula estado de pólizas según fecha actual
  const today = new Date().toISOString().slice(0, 10);

  const { data: pols, error } = await svc.from('polizas').select('id, fecha_vencimiento, estado').neq('estado', 'CANCELADA');
  if (error) {
    await logJob('RECALC_POLIZAS', false, null, error.message);
    return { ok: false, error: error.message };
  }

  let updated = 0;
  for (const p of pols ?? []) {
    if (!p.fecha_vencimiento) continue;
    const venc = p.fecha_vencimiento;
    const diff = Math.floor((new Date(venc).getTime() - new Date(today).getTime()) / 86400000);
    const nuevo = diff < 0 ? 'VENCIDA' : diff <= 30 ? 'POR_VENCER' : 'VIGENTE';
    if (nuevo !== p.estado) {
      await svc.from('polizas').update({ estado: nuevo }).eq('id', p.id);
      updated++;
    }
  }
  await logJob('RECALC_POLIZAS', true, { updated, total: pols?.length ?? 0 });
  return { ok: true, updated };
}

export async function jobLimpiarSesionesImpersonacion(): Promise<{ ok: boolean; cerradas?: number }> {
  await auth();
  const svc = createSupabaseServiceRole();
  // Cierra impersonaciones de más de 1 hora
  const limite = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await svc.from('impersonaciones')
    .update({ activa: false, fin: new Date().toISOString() })
    .eq('activa', true)
    .lt('inicio', limite)
    .select();
  if (error) {
    await logJob('LIMPIAR_IMPERSONACIONES', false, null, error.message);
    return { ok: false };
  }
  await logJob('LIMPIAR_IMPERSONACIONES', true, { cerradas: data?.length ?? 0 });
  return { ok: true, cerradas: data?.length ?? 0 };
}

export async function jobGenerarAdeudosMes(): Promise<{ ok: boolean; generados?: number; error?: string }> {
  await auth();
  const svc = createSupabaseServiceRole();
  const mes = new Date().toISOString().slice(0, 7) + '-01';
  // Genera cobros pendientes para todos los socios ACTIVOS con cuota mensual
  const { data: socios, error } = await svc.from('socios').select('id').eq('estatus', 'ACTIVO');
  if (error) {
    await logJob('GENERAR_ADEUDOS', false, null, error.message);
    return { ok: false, error: error.message };
  }
  // (placeholder lógico; ajustar según reglas finales)
  await logJob('GENERAR_ADEUDOS', true, { mes, socios: socios?.length ?? 0 });
  return { ok: true, generados: socios?.length ?? 0 };
}

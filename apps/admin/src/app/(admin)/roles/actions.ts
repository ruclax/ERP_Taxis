'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin, createSupabaseServiceRole, getSuperadminUserOrRedirect } from '@/lib/supabase-server';

async function auth() {
  const { user, isAdmin } = await getSuperadminUserOrRedirect();
  if (!user || !isAdmin) throw new Error('No autorizado');
}

async function logAction(action: string, entityId: string, before: unknown, after: unknown) {
  const sb = await createSupabaseAdmin();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await createSupabaseServiceRole().from('auditoria').insert({
    user_id: user.id,
    user_email: user.email,
    rol_activo: 'superadmin',
    accion: action,
    entidad: 'roles',
    entidad_id: entityId,
    valor_antes: (before as never) ?? null,
    valor_despues: (after as never) ?? null,
  });
}

export async function actualizarModulosRol(
  codigo: string, modulos: string[]
): Promise<{ ok: boolean; error?: string }> {
  await auth();
  const svc = createSupabaseServiceRole();
  const { data: before } = await svc.from('roles').select('modulos_acceso').eq('codigo', codigo).single();
  const { error } = await svc.from('roles').update({ modulos_acceso: modulos }).eq('codigo', codigo);
  if (error) return { ok: false, error: error.message };
  await logAction('UPDATE_ROL_MODULOS', codigo, before, { modulos });
  revalidatePath('/roles');
  return { ok: true };
}

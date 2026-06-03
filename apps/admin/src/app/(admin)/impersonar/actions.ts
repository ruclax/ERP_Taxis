'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServiceRole, getSuperadminUserOrRedirect } from '@/lib/supabase-server';

async function auth() {
  const { user, isAdmin } = await getSuperadminUserOrRedirect();
  if (!user || !isAdmin) throw new Error('No autorizado');
  return user;
}

export async function iniciarImpersonacion(targetUserId: string, motivo: string): Promise<{ ok: boolean; error?: string; magicLink?: string }> {
  const me = await auth();
  const svc = createSupabaseServiceRole();

  // Registrar sesión
  await svc.from('impersonaciones').insert({
    superadmin_user_id: me.id,
    target_user_id: targetUserId,
    motivo,
  });

  // Generar magic link para el target (válido 1 hora)
  const { data: targetUser } = await svc.auth.admin.getUserById(targetUserId);
  if (!targetUser?.user?.email) return { ok: false, error: 'Usuario destino no encontrado' };

  const { data: linkData, error } = await svc.auth.admin.generateLink({
    type: 'magiclink',
    email: targetUser.user.email,
  });
  if (error) return { ok: false, error: error.message };

  // Auditoría
  await svc.from('auditoria').insert({
    user_id: me.id,
    user_email: me.email,
    rol_activo: 'superadmin',
    accion: 'IMPERSONATE_START',
    entidad: 'auth.users',
    entidad_id: targetUserId,
    valor_despues: { motivo, target_email: targetUser.user.email },
  });

  revalidatePath('/impersonar');
  return { ok: true, magicLink: linkData.properties?.action_link };
}

export async function terminarImpersonacion(impersonacionId: string): Promise<{ ok: boolean }> {
  await auth();
  const svc = createSupabaseServiceRole();
  await svc.from('impersonaciones').update({ activa: false, fin: new Date().toISOString() }).eq('id', impersonacionId);
  revalidatePath('/impersonar');
  return { ok: true };
}

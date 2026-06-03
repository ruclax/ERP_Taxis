'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServiceRole, getSuperadminUserOrRedirect } from '@/lib/supabase-server';

async function auth() {
  const { user, isAdmin } = await getSuperadminUserOrRedirect();
  if (!user || !isAdmin) throw new Error('No autorizado');
  return user;
}

export async function actualizarModulo(codigo: string, updates: {
  activo?: boolean;
  beta?: boolean;
  mantenimiento?: boolean;
  mensaje_mantenimiento?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await auth();
  const svc = createSupabaseServiceRole();
  const { data: before } = await svc.from('modulos_config').select('*').eq('codigo', codigo).single();
  const { error } = await svc.from('modulos_config').update({ ...updates, updated_by_user_id: user.id }).eq('codigo', codigo);
  if (error) return { ok: false, error: error.message };

  await svc.from('auditoria').insert({
    user_id: user.id,
    user_email: user.email,
    rol_activo: 'superadmin',
    accion: 'UPDATE_MODULO',
    entidad: 'modulos_config',
    entidad_id: codigo,
    valor_antes: before,
    valor_despues: { ...before, ...updates },
  });

  revalidatePath('/modulos');
  return { ok: true };
}

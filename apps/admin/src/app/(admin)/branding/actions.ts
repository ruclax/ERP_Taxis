'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServiceRole, getSuperadminUserOrRedirect } from '@/lib/supabase-server';

export async function guardarBranding(updates: {
  nombre_sistema?: string;
  nombre_org?: string;
  logo_url?: string | null;
  color_primario?: string;
  color_acento?: string;
  tipografia?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { user, isAdmin } = await getSuperadminUserOrRedirect();
  if (!user || !isAdmin) return { ok: false, error: 'No autorizado' };

  const svc = createSupabaseServiceRole();
  const { error } = await svc.from('branding_config').update({ ...updates, updated_by_user_id: user.id }).eq('id', 1);
  if (error) return { ok: false, error: error.message };

  await svc.from('auditoria').insert({
    user_id: user.id,
    user_email: user.email,
    rol_activo: 'superadmin',
    accion: 'UPDATE_BRANDING',
    entidad: 'branding_config',
    entidad_id: '1',
    valor_despues: updates as never,
  });

  revalidatePath('/branding');
  return { ok: true };
}

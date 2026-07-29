'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@erp/db/client/server';

export type PerfilResult = { ok: true } | { ok: false; error: string };

export async function actualizarPerfilAction(nombreDisplay: string): Promise<PerfilResult> {
  if (nombreDisplay.trim().length < 2) {
    return { ok: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }
  try {
    const sb = createSupabaseServer(await cookies());
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { ok: false, error: 'Sesión no válida' };
    const { error } = await sb
      .from('usuarios_perfil')
      .update({ nombre_display: nombreDisplay.trim() } as never)
      .eq('user_id', user.id);
    if (error) throw error;
    revalidatePath('/mipanel');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo guardar el perfil' };
  }
}

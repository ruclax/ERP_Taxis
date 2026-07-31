'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@erp/db/client/server';
import { actualizarSitio, asignarDelegado, type SitioDatos } from '@erp/db/queries/sitios';

export type SitioResult = { ok: true } | { ok: false; error: string };

export async function actualizarSitioAction(id: string, datos: SitioDatos): Promise<SitioResult> {
  if (!datos.nombre?.trim()) return { ok: false, error: 'El nombre del sitio es obligatorio' };
  try {
    const sb = createSupabaseServer(await cookies());
    await actualizarSitio(sb, id, { ...datos, nombre: datos.nombre.trim() });
    revalidatePath(`/sitios/${id}`);
    revalidatePath('/sitios');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo guardar el sitio' };
  }
}

export async function asignarDelegadoAction(sitioId: string, socioId: string | null): Promise<SitioResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    await asignarDelegado(sb, sitioId, socioId);
    revalidatePath(`/sitios/${sitioId}`);
    revalidatePath('/sitios');
    return { ok: true };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === '42501') return { ok: false, error: 'No tienes permiso para asignar delegados' };
    return { ok: false, error: err.message ?? 'No se pudo asignar el delegado' };
  }
}

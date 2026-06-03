'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@erp/db/client/server';
import {
  asignarChofer,
  terminarChofer,
  type ChoferRol,
} from '@erp/db/queries/choferes';

export type AsignarResult = { ok: true; id: string } | { ok: false; error: string };

export async function asignarChoferAction(form: {
  concesion_id: string;
  chofer_socio_id: string;
  rol: ChoferRol;
  fecha_inicio: string;
  porcentaje?: number | null;
  renta_diaria?: number | null;
  observaciones?: string | null;
  expediente_socio_id: string;
}): Promise<AsignarResult> {
  if (!form.concesion_id || !form.chofer_socio_id || !form.fecha_inicio) {
    return { ok: false, error: 'Faltan datos obligatorios' };
  }
  try {
    const sb = createSupabaseServer(await cookies());
    const data = await asignarChofer(sb, {
      concesion_id: form.concesion_id,
      chofer_socio_id: form.chofer_socio_id,
      rol: form.rol,
      fecha_inicio: form.fecha_inicio,
      porcentaje: form.porcentaje ?? null,
      renta_diaria: form.renta_diaria ?? null,
      observaciones: form.observaciones ?? null,
    });
    revalidatePath(`/padron/${form.expediente_socio_id}`);
    return { ok: true, id: (data as { id: string }).id };
  } catch (e) {
    const err = e as { message?: string; code?: string };
    if (err.code === '23P01' || err.message?.includes('cc_no_overlap')) {
      return { ok: false, error: 'Este chofer ya tiene un contrato que se traslapa en esa fecha' };
    }
    if (err.code === '23505') {
      return { ok: false, error: 'Este chofer ya tiene un contrato activo en esta concesión' };
    }
    return { ok: false, error: err.message ?? 'No se pudo asignar el chofer' };
  }
}

export type TerminarResult = { ok: boolean; error?: string };

export async function terminarChoferAction(input: {
  contrato_id: string;
  fecha_fin?: string;
  expediente_socio_id: string;
}): Promise<TerminarResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    await terminarChofer(sb, input.contrato_id, input.fecha_fin);
    revalidatePath(`/padron/${input.expediente_socio_id}`);
    return { ok: true };
  } catch (e) {
    const err = e as { message?: string };
    return { ok: false, error: err.message ?? 'No se pudo terminar el contrato' };
  }
}

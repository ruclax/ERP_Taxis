'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@erp/db/client/server';
import {
  guardarVehiculo,
  guardarPoliza,
  type VehiculoDatos,
  type PolizaDatos,
} from '@erp/db/queries/vehiculos';

export type FlotaResult = { ok: true } | { ok: false; error: string };

/** Crea o edita el vehículo de una concesión, desde el expediente. */
export async function guardarVehiculoAction(
  expedienteSocioId: string,
  datos: VehiculoDatos,
  opts: { id?: string; concesionId?: string }
): Promise<FlotaResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    await guardarVehiculo(sb, { ...opts, datos });
    revalidatePath(`/padron/${expedienteSocioId}`);
    revalidatePath('/flota');
    return { ok: true };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === '23505') return { ok: false, error: 'Ya existe un vehículo con esas placas o serie' };
    return { ok: false, error: err.message ?? 'No se pudo guardar el vehículo' };
  }
}

/** Registra (renovación) o edita una póliza de un vehículo, desde el expediente. */
export async function guardarPolizaAction(
  expedienteSocioId: string,
  datos: PolizaDatos,
  opts: { id?: string; vehiculoId?: string }
): Promise<FlotaResult> {
  if (!datos.numero_poliza?.trim() || !datos.compania?.trim()) {
    return { ok: false, error: 'Número de póliza y compañía son obligatorios' };
  }
  if (!datos.fecha_vencimiento) {
    return { ok: false, error: 'La fecha de vencimiento es obligatoria' };
  }
  try {
    const sb = createSupabaseServer(await cookies());
    await guardarPoliza(sb, { ...opts, datos });
    revalidatePath(`/padron/${expedienteSocioId}`);
    revalidatePath('/flota');
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo guardar la póliza' };
  }
}

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@erp/db/client/server';
import {
  nuevoSocioFormSchema,
  type NuevoSocioForm,
} from '@erp/shared/validators';

export type { NuevoSocioForm };

export type CrearSocioResult =
  | { ok: true; socioId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function crearSocio(form: NuevoSocioForm): Promise<CrearSocioResult> {
  const parsed = nuevoSocioFormSchema.safeParse(form);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.')] = issue.message;
    }
    return { ok: false, error: 'Datos inválidos', fieldErrors };
  }

  const sb = createSupabaseServer(await cookies());

  // Alta transaccional: socio + dirección + contacto + concesión en una
  // sola transacción vía RPC. Si algo falla, no queda nada a medias.
  const { data, error } = await sb.rpc(
    'crear_socio_completo' as never,
    { payload: parsed.data } as never
  );

  if (error) {
    const e = error as { code?: string; message?: string };
    if (e.code === '23505') {
      const msg = e.message?.includes('rfc') ? 'Ya existe un socio con ese RFC'
        : e.message?.includes('curp') ? 'Ya existe un socio con esa CURP'
        : e.message?.includes('escalafon') ? 'El número de escalafón ya está asignado'
        : e.message?.includes('numero_concesion') ? 'Ya existe una concesión con ese número'
        : 'Ya existe un registro con esos datos';
      return { ok: false, error: msg };
    }
    return { ok: false, error: e.message ?? 'No se pudo crear el socio' };
  }

  revalidatePath('/padron');
  revalidatePath('/flota');
  return { ok: true, socioId: data as unknown as string };
}

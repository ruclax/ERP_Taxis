'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@erp/db/client/server';
import {
  nuevoSocioFormSchema,
  type NuevoSocioForm,
} from '@erp/shared/validators';

// IMPORTANTE: un archivo 'use server' solo puede exportar funciones async (server
// actions). Exportar tipos aquí rompe en producción: el transform de server-actions
// deja una referencia al tipo como valor → "ReferenceError: NuevoSocioForm is not
// defined" al evaluar el módulo → 500 en CUALQUIER llamada a la acción.
// Los tipos se importan desde '@erp/shared/validators' donde se necesiten.

type CrearSocioResult =
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

  // Todo envuelto en try/catch para que NUNCA arroje un error 500 al cliente:
  // cualquier fallo se devuelve como { ok:false } con un mensaje entendible.
  try {
    const sb = createSupabaseServer(await cookies());

    // Verifica que la sesión llegó al servidor (si no, la escritura correría como
    // anónimo y RLS la bloquearía con un error poco claro).
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) {
      return { ok: false, error: 'Tu sesión no se validó en el servidor. Cierra sesión y vuelve a entrar, luego intenta de nuevo.' };
    }

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
      if (e.code === '42501' || /row-level security|permission denied/i.test(e.message ?? '')) {
        return { ok: false, error: 'No tienes permiso para dar de alta agremiados. Inicia sesión con una cuenta de Secretaría General, Organización o Administrador.' };
      }
      return { ok: false, error: e.message ?? 'No se pudo crear el socio' };
    }

    revalidatePath('/padron');
    revalidatePath('/flota');
    return { ok: true, socioId: data as unknown as string };
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? 'Error inesperado al crear el socio';
    if (/row-level security|permission denied|42501/i.test(msg)) {
      return { ok: false, error: 'No tienes permiso para dar de alta agremiados. Inicia sesión con una cuenta de Secretaría General, Organización o Administrador.' };
    }
    return { ok: false, error: msg };
  }
}

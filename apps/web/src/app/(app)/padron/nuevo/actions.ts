'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@erp/db/client/server';
import {
  nuevoSocioFormSchema,
  type NuevoSocioForm,
  type SocioInsert,
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
  const { socio, direccion, contacto, concesion } = parsed.data;

  const sb = createSupabaseServer(await cookies());

  // 1) Insertar socio
  const socioPayload: SocioInsert = { ...socio };
  const { data: newSocio, error: errSocio } = await sb
    .from('socios')
    .insert(socioPayload as never)
    .select('id')
    .single();
  if (errSocio || !newSocio) {
    if (errSocio?.code === '23505') {
      const msg = errSocio.message.includes('rfc') ? 'Ya existe un socio con ese RFC'
        : errSocio.message.includes('curp') ? 'Ya existe un socio con esa CURP'
        : errSocio.message.includes('escalafon') ? 'El número de escalafón ya está asignado'
        : 'Ya existe un registro con esos datos';
      return { ok: false, error: msg };
    }
    return { ok: false, error: errSocio?.message ?? 'No se pudo crear el socio' };
  }
  const socioId = (newSocio as { id: string }).id;

  // 2) Dirección (opcional)
  if (direccion && (direccion.calle || direccion.colonia || direccion.municipio)) {
    const { error: errDir } = await sb
      .from('socios_direcciones')
      .insert({ socio_id: socioId, ...direccion } as never);
    if (errDir) console.error('[crearSocio] dirección:', errDir.message);
  }

  // 3) Contacto (opcional)
  if (contacto && (contacto.telefono_movil || contacto.telefono_fijo || contacto.email)) {
    const { error: errCon } = await sb
      .from('socios_contactos')
      .insert({
        socio_id: socioId,
        telefono_movil: contacto.telefono_movil || null,
        telefono_fijo: contacto.telefono_fijo || null,
        email: contacto.email || null,
      } as never);
    if (errCon) console.error('[crearSocio] contacto:', errCon.message);
  }

  // 4) Concesión (opcional)
  if (concesion?.numero_concesion) {
    const { error: errCon } = await sb
      .from('concesiones')
      .insert({
        numero_concesion: concesion.numero_concesion,
        socio_id: socioId,
        sitio_id: concesion.sitio_id ?? null,
        taxi_numero: concesion.taxi_numero ?? null,
        tipo: 'CONCESION',
        estado: 'VIGENTE',
      } as never);
    if (errCon) {
      // Socio se creó OK pero la concesión falló — informar pero no rollback
      console.error('[crearSocio] concesión:', errCon.message);
      revalidatePath('/padron');
      return {
        ok: false,
        error: `Socio creado, pero la concesión falló: ${errCon.message}. Agrégala desde el expediente.`,
      };
    }
  }

  revalidatePath('/padron');
  revalidatePath('/flota');
  return { ok: true, socioId };
}

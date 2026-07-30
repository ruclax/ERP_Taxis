'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@erp/db/client/server';
import {
  asignarChofer,
  terminarChofer,
  type ChoferRol,
} from '@erp/db/queries/choferes';
import {
  actualizarSocio,
  actualizarFotoSocio,
  guardarDireccionActual,
  agregarContacto,
  eliminarContacto,
  agregarBeneficiario,
  actualizarBeneficiario,
  eliminarBeneficiario,
  guardarLicenciaActual,
  guardarCredencial,
  cambiarEstatusSocio,
  type SocioUpdatable,
  type DireccionActual,
  type ContactoTipo,
  type BeneficiarioInput,
  type LicenciaInput,
  type CredencialInput,
  type EstatusSocioValor,
} from '@erp/db/queries/socios';

export type ActualizarSocioResult = { ok: true } | { ok: false; error: string };

/** Edición del expediente (M2, bloque Datos + Clasificación). */
export async function actualizarSocioAction(
  id: string,
  cambios: Omit<SocioUpdatable, 'updated_by_user_id'>
): Promise<ActualizarSocioResult> {
  if (typeof cambios.nombre_completo === 'string' && cambios.nombre_completo.trim().length < 3) {
    return { ok: false, error: 'El nombre completo es obligatorio (mínimo 3 caracteres)' };
  }
  try {
    const sb = createSupabaseServer(await cookies());
    const { data: userData } = await sb.auth.getUser();
    await actualizarSocio(sb, id, { ...cambios, updated_by_user_id: userData.user?.id ?? null });
    revalidatePath(`/padron/${id}`);
    return { ok: true };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === '23505') {
      const msg = err.message?.includes('rfc') ? 'Ya existe un socio con ese RFC'
        : err.message?.includes('curp') ? 'Ya existe un socio con esa CURP'
        : err.message?.includes('escalafon') ? 'El número de escalafón ya está asignado'
        : 'Ya existe un registro con esos datos';
      return { ok: false, error: msg };
    }
    return { ok: false, error: err.message ?? 'No se pudo actualizar el socio' };
  }
}

// ── M2 bloque 2: dirección + contactos ──
export type SimpleResult = { ok: true } | { ok: false; error: string };

// ── Foto de perfil del socio ──
export async function subirFotoAction(formData: FormData): Promise<SimpleResult> {
  const file = formData.get('file') as File | null;
  const socioId = (formData.get('socio_id') as string | null) ?? '';
  if (!file || file.size === 0) return { ok: false, error: 'Selecciona una imagen' };
  if (!socioId) return { ok: false, error: 'Falta el socio' };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { ok: false, error: 'Formato no permitido (usa JPG, PNG o WebP)' };
  }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'La imagen supera 5 MB' };
  try {
    const sb = createSupabaseServer(await cookies());
    const path = `socios/${socioId}`;
    const { error: up } = await sb.storage.from('fotos').upload(path, file, { contentType: file.type, upsert: true });
    if (up) return { ok: false, error: up.message };
    const { data: pub } = sb.storage.from('fotos').getPublicUrl(path);
    await actualizarFotoSocio(sb, socioId, `${pub.publicUrl}?v=${Date.now()}`);
    revalidatePath(`/padron/${socioId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo subir la foto' };
  }
}

export async function guardarDireccionAction(
  socioId: string,
  dir: DireccionActual
): Promise<SimpleResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    await guardarDireccionActual(sb, socioId, dir);
    revalidatePath(`/padron/${socioId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo guardar la dirección' };
  }
}

export async function agregarContactoAction(
  socioId: string,
  contacto: { tipo: ContactoTipo; valor: string; es_principal?: boolean }
): Promise<SimpleResult> {
  if (!contacto.valor?.trim()) return { ok: false, error: 'Captura el valor del contacto' };
  try {
    const sb = createSupabaseServer(await cookies());
    await agregarContacto(sb, socioId, { ...contacto, valor: contacto.valor.trim() });
    revalidatePath(`/padron/${socioId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo agregar el contacto' };
  }
}

export async function eliminarContactoAction(id: string, socioId: string): Promise<SimpleResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    await eliminarContacto(sb, id);
    revalidatePath(`/padron/${socioId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo eliminar el contacto' };
  }
}

// ── M2 bloque 3: beneficiarios ──
export async function guardarBeneficiarioAction(
  socioId: string,
  beneficiario: BeneficiarioInput,
  id?: string
): Promise<SimpleResult> {
  if (!beneficiario.nombre?.trim()) return { ok: false, error: 'Captura el nombre del beneficiario' };
  if (beneficiario.porcentaje != null && (beneficiario.porcentaje < 0 || beneficiario.porcentaje > 100)) {
    return { ok: false, error: 'El porcentaje debe estar entre 0 y 100' };
  }
  try {
    const sb = createSupabaseServer(await cookies());
    const b = { ...beneficiario, nombre: beneficiario.nombre.trim() };
    if (id) await actualizarBeneficiario(sb, id, b);
    else await agregarBeneficiario(sb, socioId, b);
    revalidatePath(`/padron/${socioId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo guardar el beneficiario' };
  }
}

export async function eliminarBeneficiarioAction(id: string, socioId: string): Promise<SimpleResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    await eliminarBeneficiario(sb, id);
    revalidatePath(`/padron/${socioId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo eliminar el beneficiario' };
  }
}

// ── M2 bloque 4: identificaciones ──
export async function guardarLicenciaAction(socioId: string, lic: LicenciaInput): Promise<SimpleResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    await guardarLicenciaActual(sb, socioId, lic);
    revalidatePath(`/padron/${socioId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo guardar la licencia' };
  }
}

export async function guardarCredencialAction(socioId: string, cred: CredencialInput): Promise<SimpleResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    await guardarCredencial(sb, socioId, cred);
    revalidatePath(`/padron/${socioId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo guardar la credencial' };
  }
}

// ── M4: cambio de estatus ──
export async function cambiarEstatusAction(
  socioId: string,
  nuevo: EstatusSocioValor,
  motivo: string | null,
  fecha: string | null
): Promise<SimpleResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    await cambiarEstatusSocio(sb, socioId, nuevo, motivo?.trim() || null, fecha || null);
    revalidatePath(`/padron/${socioId}`);
    revalidatePath('/padron');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'No se pudo cambiar el estatus' };
  }
}

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

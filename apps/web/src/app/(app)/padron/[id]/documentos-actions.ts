'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@erp/db/client/server';
import {
  crearDocumento,
  eliminarDocumento,
  signedUrlDocumento,
  rutaDocumento,
  ownerFields,
  type DocumentoOwner,
  type TipoDocumento,
} from '@erp/db/queries/documentos';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB — espejo del límite del bucket
const MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export type SubirResult = { ok: true; id: string } | { ok: false; error: string };

/** Sube el archivo a Storage y registra su metadata (respeta RLS de la sesión). */
export async function subirDocumentoAction(formData: FormData): Promise<SubirResult> {
  const file = formData.get('file') as File | null;
  const ownerTipo = formData.get('owner_tipo') as DocumentoOwner['tipo'] | null;
  const ownerId = formData.get('owner_id') as string | null;
  const tipo = formData.get('tipo') as TipoDocumento | null;
  const titulo = (formData.get('titulo') as string | null)?.trim() || null;
  const vigencia = (formData.get('vigencia') as string | null) || null;
  const expedienteSocioId = (formData.get('expediente_socio_id') as string | null) ?? '';

  if (!file || file.size === 0) return { ok: false, error: 'Selecciona un archivo' };
  if (!ownerTipo || !ownerId || !tipo) return { ok: false, error: 'Faltan datos del documento' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'El archivo supera el límite de 15 MB' };
  if (!MIMES.includes(file.type)) {
    return { ok: false, error: 'Formato no permitido (usa PDF, JPG, PNG o WebP)' };
  }

  try {
    const sb = createSupabaseServer(await cookies());
    const { data: userData } = await sb.auth.getUser();
    const owner = { tipo: ownerTipo, id: ownerId } as DocumentoOwner;
    const documentoId = crypto.randomUUID();
    const ext = file.name.includes('.') ? file.name.split('.').pop()! : '';
    const path = rutaDocumento(owner, documentoId, ext);

    const { error: upErr } = await sb.storage
      .from('expedientes')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return { ok: false, error: upErr.message };

    await crearDocumento(sb, {
      id: documentoId,
      ...ownerFields(owner),
      tipo,
      titulo,
      storage_path: path,
      nombre_original: file.name,
      mime: file.type,
      tamano_bytes: file.size,
      vigencia,
      subido_por: userData.user?.id ?? null,
    });

    revalidatePath(`/padron/${expedienteSocioId}`);
    return { ok: true, id: documentoId };
  } catch (e) {
    const err = e as { message?: string };
    return { ok: false, error: err.message ?? 'No se pudo subir el documento' };
  }
}

export type VerResult = { ok: true; url: string } | { ok: false; error: string };

/** Genera una URL firmada temporal (1 h) para visualizar el documento. */
export async function verDocumentoAction(storagePath: string): Promise<VerResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    const url = await signedUrlDocumento(sb, storagePath, 3600);
    return { ok: true, url };
  } catch (e) {
    const err = e as { message?: string };
    return { ok: false, error: err.message ?? 'No se pudo generar el enlace' };
  }
}

export type EliminarResult = { ok: boolean; error?: string };

export async function eliminarDocumentoAction(
  id: string,
  expedienteSocioId: string
): Promise<EliminarResult> {
  try {
    const sb = createSupabaseServer(await cookies());
    await eliminarDocumento(sb, id);
    revalidatePath(`/padron/${expedienteSocioId}`);
    return { ok: true };
  } catch (e) {
    const err = e as { message?: string };
    return { ok: false, error: err.message ?? 'No se pudo eliminar el documento' };
  }
}

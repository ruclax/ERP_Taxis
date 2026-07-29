import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// Ver nota en queries/socios.ts sobre los genéricos de SupabaseClient.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

export type TipoDocumento = Database['public']['Enums']['tipo_documento'];
export type Documento = Database['public']['Tables']['documentos']['Row'];
export type DocumentoInsert = Database['public']['Tables']['documentos']['Insert'];

/** Bucket privado de Storage donde viven los archivos digitalizados. */
export const BUCKET_EXPEDIENTES = 'expedientes';

/** Entidad dueña de un documento. Exactamente una por documento. */
export type DocumentoOwner =
  | { tipo: 'socio'; id: string }
  | { tipo: 'concesion'; id: string }
  | { tipo: 'vehiculo'; id: string }
  | { tipo: 'poliza'; id: string };

type OwnerCol = 'socio_id' | 'concesion_id' | 'vehiculo_id' | 'poliza_id';

const OWNER_COL: Record<DocumentoOwner['tipo'], OwnerCol> = {
  socio: 'socio_id',
  concesion: 'concesion_id',
  vehiculo: 'vehiculo_id',
  poliza: 'poliza_id',
};

/** Lista los documentos de una entidad, más recientes primero. */
export async function listarDocumentos(sb: SB, owner: DocumentoOwner): Promise<Documento[]> {
  const { data, error } = await sb
    .from('documentos')
    .select('*')
    .eq(OWNER_COL[owner.tipo], owner.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Trae en un solo query todos los documentos ligados al expediente:
 * el socio y sus concesiones / vehículos / pólizas.
 */
export async function listarDocumentosExpediente(
  sb: SB,
  ids: { socioId: string; concesionIds?: string[]; vehiculoIds?: string[]; polizaIds?: string[] }
): Promise<Documento[]> {
  const conds = [`socio_id.eq.${ids.socioId}`];
  if (ids.concesionIds?.length) conds.push(`concesion_id.in.(${ids.concesionIds.join(',')})`);
  if (ids.vehiculoIds?.length) conds.push(`vehiculo_id.in.(${ids.vehiculoIds.join(',')})`);
  if (ids.polizaIds?.length) conds.push(`poliza_id.in.(${ids.polizaIds.join(',')})`);
  const { data, error } = await sb
    .from('documentos')
    .select('*')
    .or(conds.join(','))
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * URL firmada temporal para visualizar o descargar un documento privado.
 * `expiresIn` en segundos (por defecto 1 hora).
 */
export async function signedUrlDocumento(sb: SB, storagePath: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await sb.storage
    .from(BUCKET_EXPEDIENTES)
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Ruta canónica dentro del bucket: {tipo_dueno}/{dueno_id}/{documento_id}.{ext}
 * ej. socio/9f3a…/1c2b….pdf
 */
export function rutaDocumento(owner: DocumentoOwner, documentoId: string, ext: string): string {
  const clean = ext.replace(/^\./, '').toLowerCase();
  return `${owner.tipo}/${owner.id}/${documentoId}${clean ? `.${clean}` : ''}`;
}

/** Convierte un owner en el par columna→valor para insertar en `documentos`. */
export function ownerFields(owner: DocumentoOwner): Partial<Record<OwnerCol, string>> {
  return { [OWNER_COL[owner.tipo]]: owner.id };
}

/** Registra la metadata del documento (después de subir el archivo a Storage). */
export async function crearDocumento(sb: SB, meta: DocumentoInsert): Promise<Documento> {
  const { data, error } = await sb.from('documentos').insert(meta).select('*').single();
  if (error) throw error;
  return data;
}

/** Actualiza campos editables (título, tipo, vigencia, notas). */
export async function actualizarDocumento(
  sb: SB,
  id: string,
  cambios: Partial<Pick<Documento, 'titulo' | 'tipo' | 'vigencia' | 'notas'>>
): Promise<void> {
  const { error } = await sb.from('documentos').update(cambios).eq('id', id);
  if (error) throw error;
}

/** Elimina un documento: primero el archivo en Storage, luego la metadata. */
export async function eliminarDocumento(sb: SB, id: string): Promise<void> {
  const { data: doc, error: eSel } = await sb
    .from('documentos')
    .select('storage_path')
    .eq('id', id)
    .single();
  if (eSel) throw eSel;

  if (doc?.storage_path) {
    const { error: eDel } = await sb.storage.from(BUCKET_EXPEDIENTES).remove([doc.storage_path]);
    if (eDel) throw eDel;
  }

  const { error: eMeta } = await sb.from('documentos').delete().eq('id', id);
  if (eMeta) throw eMeta;
}

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

export type SitioListado = {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  area_num: number | null;
  activo: boolean;
  delegado_socio_id: string | null;
  delegado_nombre: string | null;
  concesiones: number;
  concesiones_vigentes: number;
};

export async function listarSitios(
  sb: SB,
  filtros: { busqueda?: string; soloActivos?: boolean; sinDelegado?: boolean } = {}
): Promise<SitioListado[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = sb.from('v_sitios_listado' as never).select('*');
  if (filtros.busqueda?.trim()) q = q.ilike('nombre', `%${filtros.busqueda.trim()}%`);
  if (filtros.soloActivos) q = q.eq('activo', true);
  if (filtros.sinDelegado) q = q.is('delegado_socio_id', null);
  q = q.order('nombre', { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as SitioListado[];
}

export async function obtenerSitio(sb: SB, id: string) {
  const { data, error } = await sb
    .from('sitios')
    .select(
      `*,
       delegado:delegado_socio_id(id, nombre_completo, codigo_agremiado),
       concesiones(
         id, numero_concesion, taxi_numero, estado,
         socios(id, nombre_completo),
         vehiculos!concesion_actual_id(id, placas, marca, modelo)
       )`
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export type SitioDatos = {
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  area_num: number | null;
  notas: string | null;
  activo: boolean;
};

export async function actualizarSitio(sb: SB, id: string, datos: SitioDatos) {
  const { error } = await sb.from('sitios').update(datos as never).eq('id', id);
  if (error) throw error;
}

/** Asigna/cambia (o desasigna con null) el delegado del sitio, con sync RBAC vía RPC. */
export async function asignarDelegado(sb: SB, sitioId: string, socioId: string | null) {
  const { error } = await sb.rpc('asignar_delegado_sitio' as never, {
    p_sitio_id: sitioId,
    p_socio_id: socioId,
  } as never);
  if (error) throw error;
}

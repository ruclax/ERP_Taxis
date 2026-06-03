import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

export async function listarVehiculos(sb: SB, params: {
  busqueda?: string;
  marca?: string;
  estatus?: Database['public']['Enums']['vehiculo_estatus'];
  esIndependiente?: boolean;
  polizaVencida?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'taxi' | 'placas' | 'titular';
} = {}) {
  // Si hay búsqueda, usamos la RPC `buscar_vehiculos()` para multi-campo
  let vehiculoIds: string[] | null = null;
  if (params.busqueda?.trim()) {
    const { data, error } = await sb.rpc('buscar_vehiculos', { q: params.busqueda.trim() });
    if (error) throw error;
    vehiculoIds = ((data ?? []) as unknown as string[]) ?? [];
    if (vehiculoIds.length === 0) {
      return { data: [], total: 0 };
    }
  }

  // Paso 1: vista plana — ordena por #económico (vive en concesiones), pagina y filtra.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let vq: any = sb
    .from('v_vehiculos_listado' as never)
    .select('id', { count: 'exact' });

  if (vehiculoIds) vq = vq.in('id', vehiculoIds);
  if (params.marca) vq = vq.eq('marca', params.marca);
  if (params.estatus) vq = vq.eq('estatus', params.estatus);
  if (params.esIndependiente !== undefined) vq = vq.eq('es_independiente', params.esIndependiente);

  const orderBy = params.orderBy ?? 'taxi';
  if (orderBy === 'placas') {
    vq = vq.order('placas', { ascending: true, nullsFirst: false });
  } else if (orderBy === 'titular') {
    vq = vq.order('titular_codigo', { ascending: true, nullsFirst: false });
  } else {
    // default: #económico — secundario por placas para estabilidad
    vq = vq
      .order('taxi_numero', { ascending: true, nullsFirst: false })
      .order('placas', { ascending: true, nullsFirst: false });
  }
  if (params.limit) vq = vq.range(params.offset ?? 0, (params.offset ?? 0) + params.limit - 1);

  const { data: idsRows, count, error: errIds } = await vq;
  if (errIds) throw errIds;
  const orderedIds = ((idsRows ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (orderedIds.length === 0) return { data: [], total: count ?? 0 };

  // Paso 2: tabla con joins ricos (pólizas, sitio) para los IDs paginados
  const { data, error } = await sb
    .from('vehiculos')
    .select(`
      id, placas, numero_serie, marca, modelo, anio, color, engomado,
      estatus, es_independiente,
      concesion_actual_id,
      concesiones!concesion_actual_id(
        numero_concesion, taxi_numero,
        socios(id, nombre_completo, escalafon_numero, codigo_agremiado),
        sitios(id, nombre)
      ),
      polizas(id, numero_poliza, compania, fecha_vencimiento, estado)
    `)
    .in('id', orderedIds);
  if (error) throw error;

  // Re-ordenar según el orden devuelto por la vista
  const map = new Map((data ?? []).map((r) => [(r as { id: string }).id, r]));
  const ordered = orderedIds.map((id) => map.get(id)).filter(Boolean) as typeof data;

  return { data: ordered ?? [], total: count ?? 0 };
}

export interface VehiculoSugerencia {
  id: string;
  placas: string;
  sub: string;
  badge: string;
}

/** Top 8 sugerencias de vehículos para autocompletado */
export async function sugerirVehiculos(sb: SB, q: string): Promise<VehiculoSugerencia[]> {
  if (!q || q.trim().length < 2) return [];
  const { data, error } = await sb.rpc('sugerir_vehiculos', { q: q.trim() });
  if (error) {
    console.error('[sugerirVehiculos]', error.message);
    return [];
  }
  return (data ?? []) as unknown as VehiculoSugerencia[];
}

/** Catálogo de marcas únicas para popular el filtro de marca */
export async function listarMarcas(sb: SB): Promise<string[]> {
  const { data, error } = await sb
    .from('vehiculos')
    .select('marca')
    .not('marca', 'is', null);
  if (error) throw error;
  const set = new Set((data ?? []).map((r) => (r as { marca: string }).marca?.trim()).filter(Boolean));
  return Array.from(set).sort();
}

export type ConteosFlota = {
  todas: number;
  activas: number;
  fuera: number;
  siniestradas: number;
  baja: number;
  independientes: number;
  sindicato: number;
};

/** Conteos para vistas rápidas de Flota en un solo round-trip */
export async function conteosFlota(sb: SB): Promise<ConteosFlota> {
  const { data, error } = await sb.rpc('vista_conteos_flota' as never);
  if (error) {
    console.error('[conteosFlota]', error.message);
    return { todas: 0, activas: 0, fuera: 0, siniestradas: 0, baja: 0, independientes: 0, sindicato: 0 };
  }
  return data as unknown as ConteosFlota;
}

export async function obtenerVehiculo(sb: SB, id: string) {
  const { data, error } = await sb
    .from('vehiculos')
    .select(`
      *,
      concesiones!concesion_actual_id(
        *,
        socios(*),
        sitios(*)
      ),
      polizas(*),
      revistas_vehiculares(*),
      historial_choferes(
        *,
        socios:chofer_socio_id(id, nombre_completo, foto_url)
      ),
      bitacora_accidentes(*)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

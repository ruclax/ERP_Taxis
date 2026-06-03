import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// Aceptamos cualquier cliente Supabase tipado contra Database. El segundo y tercer
// genéricos varían según versión de @supabase/supabase-js; usamos `any` para
// tolerar ambas variantes sin perder seguridad de tipo en los retornos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

export type SociosListFilters = {
  busqueda?: string;
  estatus?: Database['public']['Enums']['socio_estatus'];
  tipoSocio?: Database['public']['Enums']['tipo_socio'];
  conAlerta?: boolean;
  socAct?: boolean;
  socVeint?: boolean;
  socTran?: boolean;
  firmaPendiente?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'codigo' | 'nombre' | 'escalafon' | 'fecha_ingreso';
};

export async function listarSocios(sb: SB, f: SociosListFilters = {}) {
  // Si hay búsqueda, primero obtenemos los IDs vía RPC `buscar_socios()`
  // que cruza socios + concesiones + vehículos.
  let socioIds: string[] | null = null;
  if (f.busqueda?.trim()) {
    const { data, error } = await sb.rpc('buscar_socios', { q: f.busqueda.trim() });
    if (error) throw error;
    socioIds = ((data ?? []) as unknown as string[]) ?? [];
    if (socioIds.length === 0) {
      return { data: [], total: 0 };
    }
  }

  let q = sb
    .from('socios')
    .select(
      `id, codigo_agremiado, rfc, curp, nombre_completo, escalafon_numero, tipo_escalafon,
       tipo_socio, estatus, soc_act, soc_veint, soc_tran, turno, firma_actual, ocupacion,
       fecha_ingreso, fecha_nacimiento, foto_url, comentarios`,
      { count: 'exact' }
    );

  if (socioIds) q = q.in('id', socioIds);
  if (f.estatus) q = q.eq('estatus', f.estatus);
  if (f.tipoSocio) q = q.eq('tipo_socio', f.tipoSocio);
  if (f.socAct) q = q.eq('soc_act', true);
  if (f.socVeint) q = q.eq('soc_veint', true);
  if (f.socTran) q = q.eq('soc_tran', true);
  if (f.firmaPendiente) q = q.eq('firma_actual', false);

  const orderCol = f.orderBy === 'codigo' ? 'codigo_agremiado'
    : f.orderBy === 'fecha_ingreso' ? 'fecha_ingreso'
    : f.orderBy === 'nombre' ? 'nombre_completo'
    : 'escalafon_numero';   // default: orden sindical histórico (concesionarios primero, luego aspirantes, luego sin escalafón)
  q = q
    // Primero por tipo: CONCESIONARIO < ASPIRANTE < NINGUNO
    .order('tipo_escalafon', { ascending: true, nullsFirst: false })
    .order(orderCol, { ascending: true, nullsFirst: false })
    .order('codigo_agremiado', { ascending: true });   // desempate estable

  if (f.limit) q = q.range(f.offset ?? 0, (f.offset ?? 0) + f.limit - 1);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}

export async function obtenerSocio(sb: SB, id: string) {
  const { data, error } = await sb
    .from('socios')
    .select(
      `*,
       socios_direcciones(*),
       socios_contactos(*),
       socios_beneficiarios(*),
       socios_credencial_elector(*),
       socios_licencia_conducir(*),
       concesiones(
         id, numero_concesion, taxi_numero, modalidad, submodalidad,
         estado, es_independiente, fecha_concesion,
         sitios(id, nombre),
         vehiculos!concesion_actual_id(
           id, placas, marca, modelo, anio, estatus,
           polizas(id, numero_poliza, compania, fecha_vencimiento, estado)
         )
       )`
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export interface SocioSugerencia {
  id: string;
  nombre: string;
  sub: string;
  badge: string;
}

/** Top 8 sugerencias de socios para autocompletado de búsqueda */
export async function sugerirSocios(sb: SB, q: string): Promise<SocioSugerencia[]> {
  if (!q || q.trim().length < 2) return [];
  const { data, error } = await sb.rpc('sugerir_socios', { q: q.trim() });
  if (error) {
    console.error('[sugerirSocios]', error.message);
    return [];
  }
  return (data ?? []) as unknown as SocioSugerencia[];
}

export type ConteosPadron = {
  todos: number;
  activos: number;
  fallecidos: number;
  baja_definitiva: number;
  baja_temporal: number;
  soc_act: number;
  soc_veint: number;
  soc_tran: number;
  firma_pendiente: number;
  firma_recabada: number;
  concesionarios: number;
  agencia: number;
  independientes: number;
  herederos: number;
};

/** Trae todos los conteos para vistas rápidas del padrón en un solo round-trip */
export async function conteosPadron(sb: SB): Promise<ConteosPadron> {
  const { data, error } = await sb.rpc('vista_conteos_padron' as never);
  if (error) {
    console.error('[conteosPadron]', error.message);
    return {
      todos: 0, activos: 0, fallecidos: 0, baja_definitiva: 0, baja_temporal: 0,
      soc_act: 0, soc_veint: 0, soc_tran: 0,
      firma_pendiente: 0, firma_recabada: 0,
      concesionarios: 0, agencia: 0, independientes: 0, herederos: 0,
    };
  }
  return data as unknown as ConteosPadron;
}

export async function contarPorEstatus(sb: SB) {
  const { data, error } = await sb.rpc('count_socios_por_estatus' as never);
  if (error) {
    // Fallback si no existe el RPC
    const { data: rows } = await sb.from('socios').select('estatus');
    const counts: Record<string, number> = {};
    for (const r of rows ?? []) counts[r.estatus] = (counts[r.estatus] ?? 0) + 1;
    return counts;
  }
  return data as Record<string, number>;
}

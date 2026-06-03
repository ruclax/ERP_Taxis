import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

export type ChoferRol = 'CHOFER' | 'CHOFER_RELEVO' | 'AYUDANTE';

export interface ConcesionChofer {
  id: string;
  concesion_id: string;
  chofer_socio_id: string;
  rol: ChoferRol;
  fecha_inicio: string;
  fecha_fin: string | null;
  porcentaje: number | null;
  renta_diaria: number | null;
  foto_gafete_url: string | null;
  observaciones: string | null;
}

/** Choferes de una concesión (todos los periodos, activos primero) */
export async function choferesPorConcesion(sb: SB, concesionId: string) {
  const { data, error } = await sb
    .from('concesion_choferes')
    .select(`
      id, concesion_id, chofer_socio_id, rol,
      fecha_inicio, fecha_fin, porcentaje, renta_diaria,
      foto_gafete_url, observaciones,
      socios:chofer_socio_id(id, nombre_completo, foto_url, rfc, escalafon_numero)
    `)
    .eq('concesion_id', concesionId)
    .order('fecha_fin', { ascending: false, nullsFirst: true })
    .order('fecha_inicio', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Concesiones donde un socio aparece como chofer (puede ser distinto al concesionario) */
export async function concesionesPorChofer(sb: SB, choferSocioId: string) {
  const { data, error } = await sb
    .from('concesion_choferes')
    .select(`
      id, fecha_inicio, fecha_fin, rol,
      concesiones:concesion_id(
        id, numero_concesion, taxi_numero, estado,
        sitios(id, nombre),
        socios:socio_id(id, nombre_completo)
      )
    `)
    .eq('chofer_socio_id', choferSocioId)
    .order('fecha_fin', { ascending: false, nullsFirst: true });
  if (error) throw error;
  return data ?? [];
}

export interface TaxiEconomico {
  concesion_id: string;
  numero_concesion: string;
  taxi_numero: number | null;
  concesion_estado: string;
  sitio_id: string | null;
  sitio_nombre: string | null;
  concesionario_socio_id: string | null;
  concesionario_nombre: string | null;
  concesionario_escalafon: number | null;
  vehiculo_actual_id: string | null;
  placas: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  color: string | null;
  vehiculo_estatus: string | null;
  choferes_activos: number;
}

/** Vista "Taxi Económico" — todo lo que define al taxi #N del sitio X */
export async function taxiEconomicoPorConcesion(sb: SB, concesionId: string): Promise<TaxiEconomico | null> {
  const { data, error } = await sb
    .from('v_taxi_economico' as never)
    .select('*')
    .eq('concesion_id', concesionId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as unknown as TaxiEconomico;
}

/** Lista de todos los taxis económicos de un sitio (ej. Puente 1 muestra del #1 al #N) */
export async function taxisEconomicosPorSitio(sb: SB, sitioId: string) {
  const { data, error } = await sb
    .from('v_taxi_economico' as never)
    .select('*')
    .eq('sitio_id', sitioId)
    .order('taxi_numero', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as TaxiEconomico[];
}

export interface NuevoChoferInput {
  concesion_id: string;
  chofer_socio_id: string;
  rol?: ChoferRol;
  fecha_inicio: string;
  fecha_fin?: string | null;
  porcentaje?: number | null;
  renta_diaria?: number | null;
  observaciones?: string | null;
}

export async function asignarChofer(sb: SB, input: NuevoChoferInput) {
  const { data, error } = await sb
    .from('concesion_choferes')
    .insert({
      concesion_id: input.concesion_id,
      chofer_socio_id: input.chofer_socio_id,
      rol: input.rol ?? 'CHOFER',
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin ?? null,
      porcentaje: input.porcentaje ?? null,
      renta_diaria: input.renta_diaria ?? null,
      observaciones: input.observaciones ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export type EstadoVencimiento = 'SIN_REGISTRO' | 'VENCIDA' | 'URGENTE' | 'PROXIMA' | 'VIGENTE';

export interface ListarChoferesFiltros {
  /** Texto a buscar en nombre/RFC/CURP/escalafón del chofer */
  busqueda?: string;
  /** Tipo: 'concesionario', 'solo_chofer' (no titular de concesión vigente), o ambos */
  tipo?: 'concesionario' | 'solo_chofer';
  /** Filtrar por sitio donde opera el taxi */
  sitioId?: string;
  /** Filtrar por estado de licencia */
  licencia?: EstadoVencimiento;
  /** Filtrar por estado de antidoping */
  antidoping?: EstadoVencimiento;
  /** Filtrar por estado de póliza del vehículo */
  poliza?: EstadoVencimiento;
  /** Solo choferes con mensualidades pendientes */
  conMensualidadesPendientes?: boolean;
  /** Solo choferes con accidentes no liquidados */
  conAccidentesPendientes?: boolean;
  limit?: number;
  offset?: number;
}

/** Lista contratos activos de choferes desde v_choferes_alertas. */
export async function listarChoferes(sb: SB, f: ListarChoferesFiltros = {}) {
  let socioIds: string[] | null = null;
  if (f.busqueda?.trim()) {
    const { data, error } = await sb.rpc('buscar_socios', { q: f.busqueda.trim() });
    if (error) throw error;
    socioIds = ((data ?? []) as unknown as string[]) ?? [];
    if (socioIds.length === 0) return { data: [], total: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = sb.from('v_choferes_alertas' as never).select('*', { count: 'exact' });

  if (socioIds) q = q.in('chofer_socio_id', socioIds);
  if (f.tipo === 'concesionario') q = q.eq('es_concesionario', true);
  if (f.tipo === 'solo_chofer')   q = q.eq('es_concesionario', false);
  if (f.sitioId) q = q.eq('sitio_id', f.sitioId);
  if (f.licencia)   q = q.eq('licencia_estado',   f.licencia);
  if (f.antidoping) q = q.eq('antidoping_estado', f.antidoping);
  if (f.poliza)     q = q.eq('poliza_estado',     f.poliza);
  if (f.conMensualidadesPendientes) q = q.gt('mensualidades_pendientes', 0);
  if (f.conAccidentesPendientes)    q = q.gt('accidentes_pendientes',    0);

  if (f.limit) q = q.range(f.offset ?? 0, (f.offset ?? 0) + f.limit - 1);
  // Orden por # económico del taxi, luego por código del chofer
  q = q.order('taxi_numero', { ascending: true, nullsFirst: false })
       .order('chofer_codigo', { ascending: true });

  const { data, count, error } = await q;
  if (error) throw error;
  return { data: (data ?? []) as ChoferAlerta[], total: count ?? 0 };
}

export interface ChoferAlerta {
  contrato_id: string;
  chofer_socio_id: string;
  concesion_id: string;
  rol: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  porcentaje: number | null;
  renta_diaria: number | null;
  chofer_codigo: string;
  chofer_nombre: string;
  chofer_rfc: string | null;
  chofer_escalafon: number | null;
  chofer_tipo_escalafon: string;
  chofer_ocupacion: string | null;
  chofer_estatus: string;
  es_concesionario: boolean;
  numero_concesion: string | null;
  taxi_numero: number | null;
  concesion_estado: string | null;
  sitio_id: string | null;
  sitio_nombre: string | null;
  titular_socio_id: string | null;
  titular_nombre: string | null;
  vehiculo_id: string | null;
  vehiculo_placas: string | null;
  licencia_vence: string | null;
  licencia_estado: EstadoVencimiento;
  antidoping_vence: string | null;
  antidoping_estado: EstadoVencimiento;
  poliza_vence: string | null;
  poliza_estado: EstadoVencimiento;
  revista_vence: string | null;
  revista_estado: EstadoVencimiento;
  mensualidades_pendientes: number;
  accidentes_pendientes: number;
}

export async function conteosChoferes(sb: SB) {
  // Una sola query a la vista — se cuenta en JS para evitar 8 round-trips
  const { data, error } = await sb.from('v_choferes_alertas' as never).select('*');
  if (error) throw error;
  const rows = (data ?? []) as ChoferAlerta[];
  return {
    total: rows.length,
    concesionarios: rows.filter((r) => r.es_concesionario).length,
    solo_chofer:    rows.filter((r) => !r.es_concesionario).length,
    licencia_vencida:   rows.filter((r) => r.licencia_estado === 'VENCIDA').length,
    licencia_porvencer: rows.filter((r) => ['URGENTE','PROXIMA'].includes(r.licencia_estado)).length,
    antidoping_vencido: rows.filter((r) => r.antidoping_estado === 'VENCIDA').length,
    poliza_vencida:     rows.filter((r) => r.poliza_estado === 'VENCIDA').length,
    con_mensualidades:  rows.filter((r) => r.mensualidades_pendientes > 0).length,
    con_accidentes:     rows.filter((r) => r.accidentes_pendientes > 0).length,
  };
}

export type ConteosChoferes = Awaited<ReturnType<typeof conteosChoferes>>;

/** Cierra el contrato del chofer (fecha_fin = hoy o la fecha dada) */
export async function terminarChofer(sb: SB, contratoId: string, fechaFin?: string) {
  const hoy = fechaFin ?? new Date().toISOString().slice(0, 10);
  const { error } = await sb
    .from('concesion_choferes')
    .update({ fecha_fin: hoy } as never)
    .eq('id', contratoId);
  if (error) throw error;
}

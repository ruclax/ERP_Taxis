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

/** Campos del socio editables desde el expediente (bloques Datos + Clasificación). */
export type SocioUpdatable = Partial<
  Pick<
    Database['public']['Tables']['socios']['Update'],
    | 'nombre_completo' | 'rfc' | 'curp' | 'fecha_nacimiento' | 'fecha_ingreso'
    | 'tipo_socio' | 'genero' | 'estado_civil' | 'ocupacion' | 'turno'
    | 'escalafon_numero' | 'tipo_escalafon' | 'soc_act' | 'soc_veint' | 'soc_tran'
    | 'tipo_padron' | 'firma_actual' | 'updated_by_user_id'
  >
>;

/** Actualiza campos del socio. La RLS gobierna quién puede (sec_general/organización/admin). */
export async function actualizarSocio(sb: SB, id: string, cambios: SocioUpdatable) {
  const { error } = await sb.from('socios').update(cambios as never).eq('id', id);
  if (error) throw error;
}

// ── Dirección actual (M2 bloque 2) ──
export type DireccionActual = {
  calle: string | null;
  numero_ext: string | null;
  numero_int: string | null;
  colonia: string | null;
  ciudad: string | null;
  estado: string | null;
  codigo_postal: string | null;
  referencias: string | null;
};

/** Inserta o actualiza la dirección `ACTUAL` del socio (una sola por índice único). */
export async function guardarDireccionActual(sb: SB, socioId: string, dir: DireccionActual) {
  const { data: existente } = await sb
    .from('socios_direcciones')
    .select('id')
    .eq('socio_id', socioId)
    .eq('es_actual', true)
    .maybeSingle();

  if (existente) {
    const { error } = await sb
      .from('socios_direcciones')
      .update(dir as never)
      .eq('id', (existente as { id: string }).id);
    if (error) throw error;
  } else {
    const { error } = await sb
      .from('socios_direcciones')
      .insert({ socio_id: socioId, tipo: 'ACTUAL', es_actual: true, ...dir } as never);
    if (error) throw error;
  }
}

// ── Contactos EAV (M2 bloque 2) ──
export type ContactoTipo = 'TEL_CEL' | 'TEL_CASA' | 'TEL_RECADO' | 'CORREO' | 'OTRO';

export async function agregarContacto(
  sb: SB,
  socioId: string,
  contacto: { tipo: ContactoTipo; valor: string; es_principal?: boolean }
) {
  const { error } = await sb
    .from('socios_contactos')
    .insert({
      socio_id: socioId,
      tipo: contacto.tipo,
      valor: contacto.valor,
      es_principal: contacto.es_principal ?? false,
    } as never);
  if (error) throw error;
}

export async function eliminarContacto(sb: SB, id: string) {
  const { error } = await sb.from('socios_contactos').delete().eq('id', id);
  if (error) throw error;
}

// ── Beneficiarios (M2 bloque 3) ──
export type BeneficiarioInput = {
  nombre: string;
  parentesco: string | null;
  telefono: string | null;
  direccion: string | null;
  porcentaje: number | null;
  es_designado: boolean;
  notas: string | null;
};

export async function agregarBeneficiario(sb: SB, socioId: string, b: BeneficiarioInput) {
  const { error } = await sb.from('socios_beneficiarios').insert({ socio_id: socioId, ...b } as never);
  if (error) throw error;
}

export async function actualizarBeneficiario(sb: SB, id: string, b: BeneficiarioInput) {
  const { error } = await sb.from('socios_beneficiarios').update(b as never).eq('id', id);
  if (error) throw error;
}

export async function eliminarBeneficiario(sb: SB, id: string) {
  const { error } = await sb.from('socios_beneficiarios').delete().eq('id', id);
  if (error) throw error;
}

// ── Licencia de conducir + Credencial de elector (M2 bloque 4) ──
export type LicenciaInput = {
  numero_licencia: string | null;
  tipo: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  observaciones: string | null;
};

/** Upsert de la licencia `es_actual` del socio (una vigente). */
export async function guardarLicenciaActual(sb: SB, socioId: string, lic: LicenciaInput) {
  const { data: existente } = await sb
    .from('socios_licencia_conducir')
    .select('id')
    .eq('socio_id', socioId)
    .eq('es_actual', true)
    .maybeSingle();
  if (existente) {
    const { error } = await sb.from('socios_licencia_conducir').update(lic as never)
      .eq('id', (existente as { id: string }).id);
    if (error) throw error;
  } else {
    const { error } = await sb.from('socios_licencia_conducir')
      .insert({ socio_id: socioId, es_actual: true, ...lic } as never);
    if (error) throw error;
  }
}

export type CredencialInput = {
  clave_elector: string | null;
  seccion: string | null;
  vigencia: string | null;
  emision: string | null;
};

/** Upsert de la credencial de elector (1:1 por socio). */
export async function guardarCredencial(sb: SB, socioId: string, cred: CredencialInput) {
  const { data: existente } = await sb
    .from('socios_credencial_elector')
    .select('id')
    .eq('socio_id', socioId)
    .maybeSingle();
  if (existente) {
    const { error } = await sb.from('socios_credencial_elector').update(cred as never)
      .eq('id', (existente as { id: string }).id);
    if (error) throw error;
  } else {
    const { error } = await sb.from('socios_credencial_elector')
      .insert({ socio_id: socioId, ...cred } as never);
    if (error) throw error;
  }
}

// ── Cambio de estatus + historial (M4) ──
export type EstatusSocioValor = Database['public']['Enums']['socio_estatus'];
export type HistorialEstatus = Database['public']['Tables']['socios_historial_estatus']['Row'];

/** Cambia el estatus del socio vía RPC transaccional (aplica reglas + registra historial). */
export async function cambiarEstatusSocio(
  sb: SB,
  socioId: string,
  nuevo: EstatusSocioValor,
  motivo: string | null,
  fecha: string | null
) {
  const { error } = await sb.rpc('cambiar_estatus_socio' as never, {
    p_socio_id: socioId,
    p_nuevo: nuevo,
    p_motivo: motivo,
    p_fecha: fecha,
  } as never);
  if (error) throw error;
}

/** Historial de transiciones de estatus del socio, más reciente primero. */
export async function listarHistorialEstatus(sb: SB, socioId: string): Promise<HistorialEstatus[]> {
  const { data, error } = await sb
    .from('socios_historial_estatus')
    .select('*')
    .eq('socio_id', socioId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
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
           id, placas, numero_serie, marca, modelo, anio, color, engomado, estatus, comentarios,
           polizas(id, numero_poliza, compania, costo, fecha_inicio, fecha_vencimiento, endoso, estado, comentarios)
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

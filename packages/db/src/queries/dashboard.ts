import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

export async function statsGenerales(sb: SB) {
  const [
    { count: socios },
    { count: activos },
    { count: vehiculos },
    { count: concesiones },
    { count: polizasVigentes },
    { count: polizasVencidas },
    { count: independientes },
    { count: alertasAntidoping },
  ] = await Promise.all([
    sb.from('socios').select('id', { count: 'exact', head: true }),
    sb.from('socios').select('id', { count: 'exact', head: true }).eq('estatus', 'ACTIVO'),
    sb.from('vehiculos').select('id', { count: 'exact', head: true }).eq('estatus', 'ACTIVO'),
    sb.from('concesiones').select('id', { count: 'exact', head: true }).eq('estado', 'VIGENTE'),
    sb.from('polizas').select('id', { count: 'exact', head: true }).eq('estado', 'VIGENTE'),
    sb.from('polizas').select('id', { count: 'exact', head: true }).eq('estado', 'VENCIDA'),
    sb.from('concesiones').select('id', { count: 'exact', head: true }).eq('es_independiente', true),
    sb.from('antidoping').select('id', { count: 'exact', head: true }).lte('fecha_vencimiento', new Date().toISOString().slice(0, 10)),
  ]);

  return {
    socios: socios ?? 0,
    socios_activos: activos ?? 0,
    vehiculos: vehiculos ?? 0,
    concesiones: concesiones ?? 0,
    polizas_vigentes: polizasVigentes ?? 0,
    polizas_vencidas: polizasVencidas ?? 0,
    independientes: independientes ?? 0,
    antidoping_alertas: alertasAntidoping ?? 0,
  };
}

export async function pendientesAtencion(sb: SB) {
  const hoy = new Date().toISOString().slice(0, 10);
  const en30 = new Date();
  en30.setDate(en30.getDate() + 30);
  const en30s = en30.toISOString().slice(0, 10);

  const [
    { count: sitiosSinDelegado },
    { count: sociosSinRfc },
    { count: licenciasPorVencer },
  ] = await Promise.all([
    sb.from('sitios').select('id', { count: 'exact', head: true }).is('delegado_socio_id', null),
    sb.from('socios').select('id', { count: 'exact', head: true }).is('rfc', null),
    sb.from('socios_licencia_conducir').select('id', { count: 'exact', head: true })
      .eq('es_actual', true).gte('fecha_vencimiento', hoy).lte('fecha_vencimiento', en30s),
  ]);

  return {
    sitios_sin_delegado: sitiosSinDelegado ?? 0,
    socios_sin_rfc: sociosSinRfc ?? 0,
    licencias_por_vencer: licenciasPorVencer ?? 0,
  };
}

export async function vencimientosProximos(sb: SB, dias = 30) {
  const hoy = new Date();
  const futuro = new Date();
  futuro.setDate(futuro.getDate() + dias);

  const { data, error } = await sb
    .from('polizas')
    .select(`
      id, numero_poliza, compania, fecha_vencimiento, estado,
      vehiculos(
        id, placas,
        concesiones!concesion_actual_id(
          numero_concesion,
          socios(nombre_completo)
        )
      )
    `)
    .lte('fecha_vencimiento', futuro.toISOString().slice(0, 10))
    .gte('fecha_vencimiento', hoy.toISOString().slice(0, 10))
    .order('fecha_vencimiento')
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

const MES_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function bucketPorMes<T>(rows: T[], getDate: (r: T) => string | null | undefined, start: Date, meses: number) {
  const buckets: { mes: string; label: string; n: number }[] = [];
  const idx = new Map<string, number>();
  for (let i = 0; i < meses; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    idx.set(key, buckets.length);
    buckets.push({ mes: key, label: MES_ABBR[d.getMonth()], n: 0 });
  }
  for (const r of rows) {
    const dt = getDate(r);
    if (!dt) continue;
    const i = idx.get(dt.slice(0, 7));
    if (i !== undefined) buckets[i].n++;
  }
  return buckets;
}

/** Pólizas que vencen por mes, próximos `meses` meses (para anticipar carga). */
export async function vencimientosPorMes(sb: SB, meses = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + meses, 1);
  const { data, error } = await sb
    .from('polizas')
    .select('fecha_vencimiento')
    .gte('fecha_vencimiento', start.toISOString().slice(0, 10))
    .lt('fecha_vencimiento', end.toISOString().slice(0, 10));
  if (error) throw error;
  return bucketPorMes(data ?? [], (r) => (r as { fecha_vencimiento: string }).fecha_vencimiento, start, meses);
}

/** Conteo de pólizas por estado (para dona). */
export async function estadoPolizas(sb: SB) {
  const [{ count: vig }, { count: pv }, { count: ven }] = await Promise.all([
    sb.from('polizas').select('id', { count: 'exact', head: true }).eq('estado', 'VIGENTE'),
    sb.from('polizas').select('id', { count: 'exact', head: true }).eq('estado', 'POR_VENCER'),
    sb.from('polizas').select('id', { count: 'exact', head: true }).eq('estado', 'VENCIDA'),
  ]);
  return { vigente: vig ?? 0, por_vencer: pv ?? 0, vencida: ven ?? 0 };
}

/** Altas (por fecha_ingreso) y bajas (por fecha_baja) por mes, últimos `meses`. */
export async function altasBajasPorMes(sb: SB, meses = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (meses - 1), 1);
  const startISO = start.toISOString().slice(0, 10);
  const [{ data: altasData }, { data: bajasData }] = await Promise.all([
    sb.from('socios').select('fecha_ingreso').gte('fecha_ingreso', startISO),
    sb.from('socios').select('fecha_baja').not('fecha_baja', 'is', null).gte('fecha_baja', startISO),
  ]);
  const altas = bucketPorMes(altasData ?? [], (r) => (r as { fecha_ingreso: string | null }).fecha_ingreso, start, meses);
  const bajas = bucketPorMes(bajasData ?? [], (r) => (r as { fecha_baja: string | null }).fecha_baja, start, meses);
  return altas.map((a, i) => ({ mes: a.mes, label: a.label, altas: a.n, bajas: bajas[i].n }));
}

export async function distribucionPorSitio(sb: SB) {
  const { data, error } = await sb
    .from('concesiones')
    .select('sitio_id, sitios(nombre)')
    .eq('estado', 'VIGENTE');
  if (error) throw error;
  const counts = new Map<string, { nombre: string; n: number }>();
  for (const row of data ?? []) {
    const r = row as unknown as { sitios: { nombre: string } | { nombre: string }[] | null };
    const sitiosRaw = r.sitios;
    const sitio = Array.isArray(sitiosRaw) ? sitiosRaw[0]?.nombre : sitiosRaw?.nombre;
    const key = sitio ?? 'Sin sitio';
    const c = counts.get(key) ?? { nombre: key, n: 0 };
    c.n++;
    counts.set(key, c);
  }
  return Array.from(counts.values()).sort((a, b) => b.n - a.n);
}

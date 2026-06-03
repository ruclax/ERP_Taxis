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

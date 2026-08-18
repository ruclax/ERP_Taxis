import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

const iso = (d: Date) => d.toISOString().slice(0, 10);
function masDias(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** Conteos por ventana de vencimiento (para indicadores del tablero y de la lista). */
export async function conteosVencimientos(sb: SB) {
  const hoy = iso(new Date());
  const [{ count: vencidas }, { count: d10 }, { count: d30 }, { count: d60 }] = await Promise.all([
    sb.from('polizas').select('id', { count: 'exact', head: true }).lt('fecha_vencimiento', hoy),
    sb.from('polizas').select('id', { count: 'exact', head: true }).gte('fecha_vencimiento', hoy).lte('fecha_vencimiento', masDias(10)),
    sb.from('polizas').select('id', { count: 'exact', head: true }).gte('fecha_vencimiento', hoy).lte('fecha_vencimiento', masDias(30)),
    sb.from('polizas').select('id', { count: 'exact', head: true }).gte('fecha_vencimiento', hoy).lte('fecha_vencimiento', masDias(60)),
  ]);
  return { vencidas: vencidas ?? 0, d10: d10 ?? 0, d30: d30 ?? 0, d60: d60 ?? 0 };
}

/** Lista de pólizas por ventana: vencidas, o las que vencen en los próximos `dias`. */
export async function listarPolizasVencimiento(sb: SB, opts: { vencidas?: boolean; dias?: number }) {
  const hoy = iso(new Date());
  let q = sb.from('polizas').select(`
    id, numero_poliza, compania, fecha_vencimiento, estado,
    vehiculos(id, placas, concesiones!concesion_actual_id(numero_concesion, socios(nombre_completo)))
  `);

  if (opts.vencidas) {
    q = q.lt('fecha_vencimiento', hoy).order('fecha_vencimiento', { ascending: false });
  } else {
    q = q.gte('fecha_vencimiento', hoy).lte('fecha_vencimiento', masDias(opts.dias ?? 30)).order('fecha_vencimiento');
  }

  const { data, error } = await q.limit(300);
  if (error) throw error;
  return data ?? [];
}

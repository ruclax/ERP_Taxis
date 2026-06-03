/**
 * Parsea CSV #3 y genera SQL batch INSERT para pólizas.
 * Output en scripts/polizas-seed.sql — luego se aplica vía MCP execute_sql.
 *
 * No requiere conexión a Postgres: solo parsea CSVs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

const UPLOADS = resolve(process.cwd(), 'uploads');

function readCsv(file: string): Record<string, string>[] {
  const bytes = readFileSync(resolve(UPLOADS, file));
  const text = new TextDecoder('windows-1252').decode(bytes);
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: false,  // No trim para detectar headers reales
  }) as Record<string, string>[];
}

function parseFecha(s: string | undefined): string | null {
  if (!s) return null;
  const t = String(s).trim();
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [_, d, mo, y] = m;
  const yy = Number(y), mm = Number(mo), dd = Number(d);
  if (yy < 1900 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function sqlEsc(v: string | null | undefined): string {
  if (v === null || v === undefined || v === '') return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sqlNum(v: string | undefined | null): string {
  if (!v) return 'NULL';
  const n = Number(String(v).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? String(n) : 'NULL';
}

const rows = readCsv('3.- Padron de Vehiculos y Polizas 2026.csv');
console.log(`Filas leídas: ${rows.length}`);

// Detectar nombres reales de columnas pólizas
const firstRow = rows[0] ?? {};
const keys = Object.keys(firstRow);
console.log('Columnas:', keys.filter((k) => /poliza|costo|hasta|desde|compañ|compa|endoso/i.test(k)));

// Buscar las claves de póliza con flexibilidad
const polizaKey = keys.find((k) => /^\s*no\.?\s*poliza\s*$/i.test(k)) ?? 'No. Poliza';
const companiaKey = keys.find((k) => /compa[ñn]/i.test(k)) ?? 'Compañía';
const costoKey = keys.find((k) => /costo/i.test(k)) ?? 'Costo';
const desdeKey = keys.find((k) => /^desde$/i.test(k)) ?? 'Desde';
const hastaKey = keys.find((k) => /^hasta$/i.test(k)) ?? 'Hasta';
const endosoKey = keys.find((k) => /endoso/i.test(k)) ?? 'Endoso';
const comentKey = keys.find((k) => /comentarios/i.test(k)) ?? 'Comentarios';
const concKey = keys.find((k) => /^concesion$/i.test(k)) ?? 'Concesion';

console.log('Mapeo claves:', { polizaKey, companiaKey, costoKey, desdeKey, hastaKey });

// Generar VALUES
const values: string[] = [];
let skipped = 0;
for (const r of rows) {
  const concNum = (r[concKey] ?? '').trim();
  const numPol = (r[polizaKey] ?? '').toString().trim();
  const venc = parseFecha(r[hastaKey]);
  if (!concNum || !numPol || !venc) {
    skipped++;
    continue;
  }
  const compania = (r[companiaKey] ?? '').toString().trim() || 'Sin compañía';
  const costo = sqlNum(r[costoKey]);
  const desde = parseFecha(r[desdeKey]);
  const endoso = (r[endosoKey] ?? '').toString().trim();
  const coment = (r[comentKey] ?? '').toString().trim();

  values.push(
    `(${sqlEsc(concNum)}, ${sqlEsc(numPol)}, ${sqlEsc(compania)}, ${costo}, ${sqlEsc(desde)}, ${sqlEsc(venc)}, ${sqlEsc(endoso || null)}, ${sqlEsc(coment || null)})`
  );
}

console.log(`Pólizas válidas: ${values.length}, descartadas: ${skipped}`);

const sql = `-- Pólizas: ${values.length} registros, generado ${new Date().toISOString()}
-- Inserta vía JOIN con vehículos (busca por concesión actual)

with raw(concesion, poliza, compania, costo, fecha_inicio, fecha_vencimiento, endoso, comentarios) as (
  values
    ${values.join(',\n    ')}
)
insert into polizas (vehiculo_id, numero_poliza, compania, costo, fecha_inicio, fecha_vencimiento, endoso, comentarios, estado)
select
  v.id,
  r.poliza,
  r.compania,
  r.costo::numeric,
  r.fecha_inicio::date,
  r.fecha_vencimiento::date,
  r.endoso,
  r.comentarios,
  case
    when r.fecha_vencimiento::date < current_date then 'VENCIDA'::poliza_estado
    when r.fecha_vencimiento::date - current_date <= 30 then 'POR_VENCER'::poliza_estado
    else 'VIGENTE'::poliza_estado
  end
from raw r
join concesiones c on c.numero_concesion = r.concesion
join vehiculos v on v.concesion_actual_id = c.id
on conflict do nothing;
`;

const outPath = resolve(process.cwd(), 'scripts', 'polizas-seed.sql');
writeFileSync(outPath, sql, 'utf8');
console.log(`SQL escrito en ${outPath} (${sql.length} bytes)`);

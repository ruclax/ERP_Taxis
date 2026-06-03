// Corrige SOC_ACT, SOC_VEINT, SOC_TRAN, TURNO, FIRMA ACTUAL para socios ya cargados.
// No reimporta — solo UPDATE en batch desde CSV #1.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import { parse } from 'csv-parse/sync';

const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const l of envFile.split(/\r?\n/)) {
  const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

// Buscar el CSV en la carpeta original del cliente
const CSV_PATH = 'C:/Users/danie/Documents/Sindicato/Plataforma admin/1.- Padron de Agremiados 2026.csv';
const bytes = readFileSync(CSV_PATH);
const text = new TextDecoder('windows-1252').decode(bytes);
const rows = parse(text, {
  columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true, trim: false, from_line: 2,
});

console.log(`Headers detectados:`, Object.keys(rows[0] ?? {}).slice(0, 12), '...');
console.log(`Total filas: ${rows.length}`);

// Detectar nombres reales de los campos (puede ser SOC_ACT, soc_act, SOC ACT, etc.)
const keys = Object.keys(rows[0] ?? {});
const findKey = (re) => keys.find((k) => re.test(k));
const kSocAct = findKey(/SOC.?ACT|S[óo]cio.?ACT/i);
const kSocVeint = findKey(/SOC.?VEINT|VEINT/i);
const kSocTran = findKey(/SOC.?TRAN|TRAN/i);
const kTurno = findKey(/^TURNO/i);
const kFirma = findKey(/FIRMA/i);
const kNombre = findKey(/NOMBRE COMPL/i);
const kRfc = findKey(/^RFC$/i);

console.log(`\nMapeo de columnas:`);
console.log(`  SOC_ACT: "${kSocAct}"`);
console.log(`  SOC_VEINT: "${kSocVeint}"`);
console.log(`  SOC_TRAN: "${kSocTran}"`);
console.log(`  TURNO: "${kTurno}"`);
console.log(`  FIRMA: "${kFirma}"`);

// Inspeccionar primeros 3 valores
console.log(`\nMuestra primeros 3 socios:`);
for (const r of rows.slice(0, 3)) {
  console.log(`  ${r[kNombre]?.slice(0, 40)} → SOC_ACT="${r[kSocAct]}" VEINT="${r[kSocVeint]}" TRAN="${r[kSocTran]}" TURNO="${r[kTurno]}" FIRMA="${r[kFirma]}"`);
}

// Detectar valores únicos de cada campo
const unique = (k) => [...new Set(rows.map((r) => r[k] ?? '').map(s => s.trim()))].slice(0, 8);
console.log(`\nValores únicos SOC_ACT: ${JSON.stringify(unique(kSocAct))}`);
console.log(`Valores únicos SOC_VEINT: ${JSON.stringify(unique(kSocVeint))}`);
console.log(`Valores únicos SOC_TRAN: ${JSON.stringify(unique(kSocTran))}`);
console.log(`Valores únicos FIRMA: ${JSON.stringify(unique(kFirma))}`);

function normNombre(s) {
  if (!s) return '';
  return s.replace(/\s*\(\+\)\s*$/, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function parseBool(s) {
  if (!s) return false;
  const t = String(s).trim().toUpperCase();
  return t === 'X' || t === '1' || t === 'SI' || t === 'SÍ' || t === 'TRUE';
}

function mapFirma(s) {
  if (!s) return 'PENDIENTE';
  const t = String(s).trim().toUpperCase();
  if (t === 'X' || t === 'SI' || t === 'SÍ' || t === '1' || /RECAB/i.test(t)) return 'RECABADA';
  return 'PENDIENTE';
}

// Conectar y aplicar UPDATE en batch
const c = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

console.log(`\nAplicando updates...`);
let updated = 0, notfound = 0;
for (const r of rows) {
  const nombre = normNombre(r[kNombre]);
  if (!nombre) continue;
  const rfc = (r[kRfc] ?? '').trim().toUpperCase() || null;

  const socAct = parseBool(r[kSocAct]);
  const socVeint = parseBool(r[kSocVeint]);
  const socTran = parseBool(r[kSocTran]);
  const turno = (r[kTurno] ?? '').trim() || null;
  const firma = mapFirma(r[kFirma]);

  if (!socAct && !socVeint && !socTran && !turno && firma === 'PENDIENTE') continue;

  // Buscar por RFC o por nombre normalizado
  const where = rfc ? 'rfc = $6' : 'nombre_completo = $6';
  const param = rfc || nombre;
  const res = await c.query(
    `update socios set
      soc_act = $1,
      soc_veint = $2,
      soc_tran = $3,
      turno = coalesce(nullif($4, ''), turno),
      firma_actual = $5
     where ${where}
     returning id`,
    [socAct, socVeint, socTran, turno ?? '', firma, param]
  );
  if (res.rowCount > 0) updated += res.rowCount;
  else notfound++;
}

console.log(`\n✅ ${updated} socios actualizados, ${notfound} no encontrados`);

// Verificar resultado
const after = await c.query(`select
  count(*) filter (where soc_act) as soc_act,
  count(*) filter (where soc_veint) as soc_veint,
  count(*) filter (where soc_tran) as soc_tran,
  count(*) filter (where firma_actual = 'RECABADA') as firma_recabada,
  count(*) filter (where turno is not null) as con_turno
  from socios`);
console.log(`\nDespués del update:`);
console.table(after.rows);

await c.end();

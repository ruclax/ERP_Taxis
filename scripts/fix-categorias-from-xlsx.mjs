// Lee el padrón ORIGINAL .xls y corrige en BD:
//  - SOC_ACT / SOC_VEINT / SOC_TRAN (acepta VERDADERO/FALSO en español)
//  - TURNO
//  - FIRMA ACTUAL → boolean (RECABADA si hay texto, PENDIENTE si vacío)
//  - Si la columna FIRMA tiene texto descriptivo (nombre o nota) lo
//    agrega a `comentarios` para no perder la información

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import XLSX from 'xlsx';

// Cargar env
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const l of envFile.split(/\r?\n/)) {
  const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const XLS_PATH = 'C:/Users/danie/Documents/Sindicato/Plataforma admin/1.- Padron de Agremiados 2026.xls';
console.log(`Leyendo ${XLS_PATH}...`);
const wb = XLSX.readFile(XLS_PATH, { cellDates: false, cellNF: false, cellText: false });
console.log(`Hojas: ${wb.SheetNames.join(', ')}`);

// Primera hoja = padrón general
const sheet = wb.Sheets[wb.SheetNames[0]];
// La fila 1 son numéricos (0..40), la 2 son los headers reales
const rows = XLSX.utils.sheet_to_json(sheet, { header: 'A', defval: '' });
const headerRow = rows[1];  // fila índice 1 = "NOMBRE COMPLETO, FECHA NAC..."
console.log(`Header row (fila 2 del xlsx):`);
for (const [k, v] of Object.entries(headerRow)) console.log(`  ${k}: ${v}`);

// Construye mapeo columna → header
const colHeader = {};
for (const [k, v] of Object.entries(headerRow)) colHeader[k] = String(v).trim();

// Recorrer filas de datos (a partir de la 3)
const data = rows.slice(2);
console.log(`\nTotal filas de datos: ${data.length}`);

// Encontrar columnas relevantes
const colByName = (name) => Object.entries(colHeader).find(([_, v]) => v === name)?.[0];
const cNombre = colByName('NOMBRE COMPLETO');
const cRfc = colByName('RFC');
const cSocAct = colByName('SOC_ACT');
const cSocVeint = colByName('SOC_VEINT');
const cSocTran = colByName('SOC_TRAN');
const cTurno = colByName('TURNO');
const cFirma = colByName('FIRMA ACTUAL');
const cComentarios = colByName('COMENTARIOS');

console.log(`\nMapeo de columnas (xlsx → BD):`);
console.log(`  NOMBRE:       ${cNombre}`);
console.log(`  RFC:          ${cRfc}`);
console.log(`  SOC_ACT:      ${cSocAct}`);
console.log(`  SOC_VEINT:    ${cSocVeint}`);
console.log(`  SOC_TRAN:     ${cSocTran}`);
console.log(`  TURNO:        ${cTurno}`);
console.log(`  FIRMA ACTUAL: ${cFirma}`);
console.log(`  COMENTARIOS:  ${cComentarios}`);

// Helpers
function normNombre(s) {
  if (!s) return '';
  return String(s).replace(/\s*\(\+\)\s*$/, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function parseBoolEspanol(s) {
  if (!s) return false;
  const t = String(s).trim().toUpperCase();
  // Excel a veces guarda como booleano nativo (TRUE/FALSE) o como texto
  if (t === 'TRUE' || t === 'VERDADERO' || t === 'X' || t === 'SI' || t === 'SÍ' || t === '1') return true;
  return false;
}

// Distingue si el texto de FIRMA es un booleano o una nota descriptiva
function clasificarFirma(s) {
  if (!s || !String(s).trim()) return { recabada: false, nota: null };
  const t = String(s).trim();
  const tUp = t.toUpperCase();
  // Booleanos puros
  if (['X', 'SI', 'SÍ', '1', 'TRUE', 'VERDADERO'].includes(tUp)) return { recabada: true, nota: null };
  if (['FALSE', 'FALSO', 'NO', '0'].includes(tUp)) return { recabada: false, nota: null };
  // Cualquier otro texto → recabada + nota
  return { recabada: true, nota: t };
}

// Conectar
const c = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

let updated = 0, notfound = 0, notasAgregadas = 0;
const ejemplosNotasFirma = [];

for (const row of data) {
  const nombre = normNombre(row[cNombre]);
  if (!nombre) continue;
  const rfc = (row[cRfc] ?? '').toString().trim().toUpperCase() || null;

  const socAct = parseBoolEspanol(row[cSocAct]);
  const socVeint = parseBoolEspanol(row[cSocVeint]);
  const socTran = parseBoolEspanol(row[cSocTran]);
  const turno = (row[cTurno] ?? '').toString().trim() || null;
  const { recabada: firmaRecabada, nota: notaFirma } = clasificarFirma(row[cFirma]);
  const comentarioCsv = (row[cComentarios] ?? '').toString().trim() || null;

  // Construir comentario consolidado (concat existente + notas de firma + comentario CSV)
  // Primero busca el comentario actual en BD para no sobreescribir
  const actual = await c.query('select id, comentarios from socios where ' + (rfc ? 'rfc = $1' : 'nombre_completo = $1'), [rfc || nombre]);
  if (actual.rowCount === 0) { notfound++; continue; }
  const { id, comentarios: comActual } = actual.rows[0];

  // Construir nuevo comentario solo si hay algo nuevo
  const partes = [];
  if (comActual?.trim()) partes.push(comActual.trim());
  if (notaFirma) {
    const linea = `[Firma actual] ${notaFirma}`;
    if (!comActual || !comActual.includes(notaFirma)) {
      partes.push(linea);
      notasAgregadas++;
      if (ejemplosNotasFirma.length < 5) ejemplosNotasFirma.push(`${nombre.slice(0,30)} → "${notaFirma.slice(0,60)}"`);
    }
  }
  if (comentarioCsv && (!comActual || !comActual.includes(comentarioCsv))) {
    partes.push(comentarioCsv);
  }
  const comentariosFinal = partes.length > 0 ? partes.join('\n') : null;

  // Update
  await c.query(
    `update socios set
       soc_act = $1,
       soc_veint = $2,
       soc_tran = $3,
       turno = coalesce(nullif($4, ''), turno),
       firma_actual = $5::firma_estatus,
       comentarios = $6
     where id = $7`,
    [socAct, socVeint, socTran, turno ?? '', firmaRecabada ? 'RECABADA' : 'PENDIENTE', comentariosFinal, id]
  );
  updated++;
}

console.log(`\n✅ ${updated} socios actualizados`);
console.log(`📝 ${notasAgregadas} notas de firma migradas al campo comentarios`);
if (notfound > 0) console.log(`⚠️  ${notfound} socios del CSV no encontrados en BD`);

if (ejemplosNotasFirma.length > 0) {
  console.log(`\nEjemplos de notas migradas:`);
  for (const e of ejemplosNotasFirma) console.log(`  ${e}`);
}

const final = await c.query(`select
  count(*) filter (where soc_act) as soc_act,
  count(*) filter (where soc_veint) as soc_veint,
  count(*) filter (where soc_tran) as soc_tran,
  count(*) filter (where firma_actual = 'RECABADA') as firma_recabada,
  count(*) filter (where firma_actual = 'PENDIENTE') as firma_pendiente,
  count(*) filter (where turno is not null) as con_turno,
  count(*) filter (where comentarios is not null) as con_comentarios
  from socios`);
console.log(`\nEstado final del padrón:`);
console.table(final.rows);

await c.end();

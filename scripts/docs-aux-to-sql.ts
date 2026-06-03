/**
 * Parsea CSV #1 y genera SQL batch para docs auxiliares (direcciones, contactos,
 * beneficiarios, credencial elector, licencia conducir).
 * No requiere conexión Postgres — solo lee CSV y escribe SQL.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

const UPLOADS = resolve(process.cwd(), 'uploads');

function readCsv(file: string, fromLine = 1): Record<string, string>[] {
  const bytes = readFileSync(resolve(UPLOADS, file));
  const text = new TextDecoder('windows-1252').decode(bytes);
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: false,
    from_line: fromLine,
  }) as Record<string, string>[];
}

function normNombre(s: string): string {
  if (!s) return '';
  return s.replace(/\s*\(\+\)\s*$/, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function parseFecha(s: string | undefined): string | null {
  if (!s) return null;
  const t = String(s).trim();
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const yy = Number(y), mm = Number(mo), dd = Number(d);
  if (yy < 1900 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function sqlEsc(v: string | null | undefined): string {
  if (v === null || v === undefined || v === '') return 'NULL';
  return `'${String(v).replace(/'/g, "''").slice(0, 500)}'`;
}

// CSV #1 — headers en fila 2
const rows = readCsv('1.- Padron de Agremiados 2026.csv', 2);
console.log(`Filas leídas: ${rows.length}`);
console.log('Headers detectados:', Object.keys(rows[0] ?? {}).slice(0, 10), '...');

const direcciones: string[] = [];
const contactos: string[] = [];
const beneficiarios: string[] = [];
const credenciales: string[] = [];
const licencias: string[] = [];

for (const r of rows) {
  const nombre = normNombre(r['NOMBRE COMPLETO']);
  if (!nombre) continue;

  // ── Direcciones (CSV trae 2: ACTUAL y CREDENCIAL) ──
  // CSV col COLONIA aparece dos veces (una por cada dirección).
  // csv-parse renombra la segunda como "COLONIA_1" automáticamente.
  const calleActual = (r['DIRECCION ACTUAL'] ?? '').trim();
  const coloniaActual = (r['COLONIA'] ?? '').trim();
  const calleCred = (r['DIRECCION CREDENCIAL'] ?? '').trim();
  const coloniaCred = (r['COLONIA_1'] ?? r['COLONIA'] ?? '').trim();
  const cp = (r['COD. POST.'] ?? '').trim();

  // Credencial = principal (es_actual=true). Si no hay credencial pero sí actual, esa toma el rol principal.
  if (calleCred || coloniaCred) {
    direcciones.push(`(${sqlEsc(nombre)}, 'CREDENCIAL', ${sqlEsc(calleCred || null)}, ${sqlEsc(coloniaCred || null)}, ${sqlEsc(cp || null)}, true)`);
  }
  if (calleActual || coloniaActual) {
    // ACTUAL es principal solo si no hay credencial
    const principal = (calleCred || coloniaCred) ? false : true;
    direcciones.push(`(${sqlEsc(nombre)}, 'ACTUAL', ${sqlEsc(calleActual || null)}, ${sqlEsc(coloniaActual || null)}, ${sqlEsc(cp || null)}, ${principal})`);
  }

  // ── Contactos ──
  const cel = (r['TEL. CEL.'] ?? '').toString().trim();
  const casa = (r['TEL. CASA'] ?? '').toString().trim();
  const correo = (r['CORREO ELECTRONICO'] ?? '').trim();
  if (cel) contactos.push(`(${sqlEsc(nombre)}, 'TEL_CEL', ${sqlEsc(cel)})`);
  if (casa) contactos.push(`(${sqlEsc(nombre)}, 'TEL_CASA', ${sqlEsc(casa)})`);
  if (correo) contactos.push(`(${sqlEsc(nombre)}, 'CORREO', ${sqlEsc(correo)})`);

  // ── Beneficiarios ──
  const esposo = (r['NOMBRE DE ESPOS@'] ?? '').trim();
  const benef = (r['BENEFICIARI@'] ?? '').trim();
  const telBenef = (r['TEL. BENEFICIARIO'] ?? '').trim();
  const dirBenef = (r['DIREC. BENEFICIARIO'] ?? '').trim();
  if (esposo) beneficiarios.push(`(${sqlEsc(nombre)}, ${sqlEsc(normNombre(esposo))}, 'CONYUGE', NULL, NULL, false)`);
  if (benef) beneficiarios.push(`(${sqlEsc(nombre)}, ${sqlEsc(normNombre(benef))}, NULL, ${sqlEsc(telBenef || null)}, ${sqlEsc(dirBenef || null)}, true)`);

  // ── Credencial de elector ──
  const clave = (r['CLAVE DE ELECTOR'] ?? '').trim();
  const seccion = (r['SECCION'] ?? '').trim();
  const vigencia = (r['VIGENCIA'] ?? '').trim();
  if (clave) {
    const vigDate = vigencia ? parseFecha(`01/01/${vigencia}`) : null;
    credenciales.push(`(${sqlEsc(nombre)}, ${sqlEsc(clave)}, ${sqlEsc(seccion || null)}, ${sqlEsc(vigDate)})`);
  }

  // ── Licencia de conducir ──
  const licNum = (r['LIC. DE COND.'] ?? '').trim();
  const licTipo = (r['TIPO'] ?? '').trim();
  const licVenc = parseFecha(r['VENCIMIENTO']);
  if (licNum) {
    licencias.push(`(${sqlEsc(nombre)}, ${sqlEsc(licNum)}, ${sqlEsc(licTipo || null)}, ${sqlEsc(licVenc)})`);
  }
}

console.log(`Direcciones: ${direcciones.length}`);
console.log(`Contactos: ${contactos.length}`);
console.log(`Beneficiarios: ${beneficiarios.length}`);
console.log(`Credenciales: ${credenciales.length}`);
console.log(`Licencias: ${licencias.length}`);

const chunks = (arr: string[], size: number): string[][] => {
  const out: string[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const buildSql = (label: string, header: string, table: string, cols: string, values: string[], chunkSize = 500): string => {
  if (values.length === 0) return `-- ${label}: 0 filas\n`;
  let sql = `-- ${label}: ${values.length} filas\n`;
  const batches = chunks(values, chunkSize);
  for (let i = 0; i < batches.length; i++) {
    sql += `\n-- batch ${i + 1}/${batches.length}\n`;
    sql += header + '\n';
    sql += `insert into ${table} ${cols}\n`;
    sql += batches[i].join(',\n') + '\n';
    sql += ';\n';
  }
  return sql;
};

let allSql = `-- Docs auxiliares: generado ${new Date().toISOString()}\n\n`;

// Direcciones
allSql += buildSql(
  'Direcciones',
  `with raw(nombre, calle, colonia, codigo_postal) as (values`,
  `socios_direcciones (socio_id, calle, colonia, codigo_postal, es_actual)`,
  direcciones.map(v => v),
  500
).replace(/^with raw/gm, 'with raw').replace(/\ninsert into socios_direcciones/g, ')\ninsert into socios_direcciones (socio_id, calle, colonia, codigo_postal, es_actual)\nselect s.id, r.calle, r.colonia, r.codigo_postal, true from raw r\njoin socios s on s.nombre_completo = r.nombre\nwhere not exists (select 1 from socios_direcciones d where d.socio_id = s.id);');

writeFileSync(resolve(process.cwd(), 'scripts', 'docs-1-direcciones.sql'), buildDirSql(direcciones));
writeFileSync(resolve(process.cwd(), 'scripts', 'docs-2-contactos.sql'), buildContSql(contactos));
writeFileSync(resolve(process.cwd(), 'scripts', 'docs-3-beneficiarios.sql'), buildBenefSql(beneficiarios));
writeFileSync(resolve(process.cwd(), 'scripts', 'docs-4-credenciales.sql'), buildCredSql(credenciales));
writeFileSync(resolve(process.cwd(), 'scripts', 'docs-5-licencias.sql'), buildLicSql(licencias));

function buildDirSql(items: string[]): string {
  if (!items.length) return '-- vacio';
  const batchSize = 400;
  let out = '';
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    out += `with raw(nombre, tipo, calle, colonia, codigo_postal, principal) as (values\n  ${chunk.join(',\n  ')}\n)\n`;
    out += `insert into socios_direcciones (socio_id, tipo, calle, colonia, codigo_postal, es_actual)\n`;
    out += `select distinct on (s.id, r.tipo) s.id, r.tipo, r.calle, r.colonia, r.codigo_postal, r.principal from raw r\n`;
    out += `join socios s on s.nombre_completo = r.nombre\n`;
    out += `on conflict (socio_id, tipo) do nothing;\n\n`;
  }
  return out;
}

function buildContSql(items: string[]): string {
  if (!items.length) return '-- vacio';
  const batchSize = 400;
  let out = '';
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    out += `with raw(nombre, tipo, valor) as (values\n  ${chunk.join(',\n  ')}\n)\n`;
    out += `insert into socios_contactos (socio_id, tipo, valor)\n`;
    out += `select s.id, r.tipo, r.valor from raw r\n`;
    out += `join socios s on s.nombre_completo = r.nombre\n`;
    out += `on conflict do nothing;\n\n`;
  }
  return out;
}

function buildBenefSql(items: string[]): string {
  if (!items.length) return '-- vacio';
  const batchSize = 400;
  let out = '';
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    out += `with raw(nombre, beneficiario, parentesco, telefono, direccion, es_designado) as (values\n  ${chunk.join(',\n  ')}\n)\n`;
    out += `insert into socios_beneficiarios (socio_id, nombre, parentesco, telefono, direccion, es_designado)\n`;
    out += `select s.id, r.beneficiario, r.parentesco, r.telefono, r.direccion, r.es_designado from raw r\n`;
    out += `join socios s on s.nombre_completo = r.nombre;\n\n`;
  }
  return out;
}

function buildCredSql(items: string[]): string {
  if (!items.length) return '-- vacio';
  const batchSize = 400;
  let out = '';
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    out += `with raw(nombre, clave_elector, seccion, vigencia) as (values\n  ${chunk.join(',\n  ')}\n)\n`;
    out += `insert into socios_credencial_elector (socio_id, clave_elector, seccion, vigencia)\n`;
    out += `select distinct on (s.id) s.id, r.clave_elector, r.seccion, r.vigencia::date from raw r\n`;
    out += `join socios s on s.nombre_completo = r.nombre\n`;
    out += `on conflict (socio_id) do nothing;\n\n`;
  }
  return out;
}

function buildLicSql(items: string[]): string {
  if (!items.length) return '-- vacio';
  const batchSize = 400;
  let out = '';
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    out += `with raw(nombre, numero, tipo, vencimiento) as (values\n  ${chunk.join(',\n  ')}\n)\n`;
    out += `insert into socios_licencia_conducir (socio_id, numero_licencia, tipo, fecha_vencimiento, es_actual)\n`;
    out += `select distinct on (s.id) s.id, r.numero, r.tipo, r.vencimiento::date, true from raw r\n`;
    out += `join socios s on s.nombre_completo = r.nombre\n`;
    out += `where not exists (select 1 from socios_licencia_conducir l where l.socio_id = s.id and l.es_actual = true);\n\n`;
  }
  return out;
}

console.log('Listos archivos en scripts/docs-*.sql');

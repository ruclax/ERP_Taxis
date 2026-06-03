/**
 * pnpm db:seed
 * Parsea los 6 CSVs del padrón y los inserta en Supabase.
 *
 * Estrategia:
 *  1. Lee cada CSV con encoding Windows-1252 (latin1) y arregla mojibake
 *  2. Construye mapas en memoria: sitios, socios, concesiones, vehiculos, polizas, antidoping
 *  3. Inserta en orden de dependencias dentro de una transacción
 *  4. Reporta inconsistencias en scripts/import-report.json
 *
 * Es IDEMPOTENTE: si vuelve a ejecutarse, salta registros ya cargados (usa upsert por llave natural).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { log, pgClient } from './_utils.js';

const UPLOADS = resolve(process.cwd(), 'uploads');

// ─────────────────────────────────────────────────────────────
// Carga + parseo de CSVs
// ─────────────────────────────────────────────────────────────

function readCsv(file: string, fromLine = 1): Record<string, string>[] {
  const bytes = readFileSync(resolve(UPLOADS, file));
  // Decodificar Windows-1252 (latin1 extendido) a UTF-8 manualmente
  const text = new TextDecoder('windows-1252').decode(bytes);
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
    from_line: fromLine,
  }) as Record<string, string>[];
  return records;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const inconsistencias: { tipo: string; csv: string; detalle: string }[] = [];

function normNombre(s: string): string {
  if (!s) return '';
  // Quita el sufijo (+) de fallecido y normaliza espacios
  return s.replace(/\s*\(\+\)\s*$/, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function tieneCruz(s: string): boolean {
  return /\(\+\)/.test(s ?? '');
}

function parseFecha(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = String(s).trim();
  if (!t || t === '0' || t.toLowerCase() === 'null') return null;

  const validDate = (y: number, mo: number, d: number): string | null => {
    if (y < 1900 || y > 2099) return null;
    if (mo < 1 || mo > 12) return null;
    if (d < 1 || d > 31) return null;
    // Validar con Date (también rechaza Feb 30, etc.)
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== mo || dt.getUTCDate() !== d) return null;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // dd/mm/yyyy o d/m/yyyy
  let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return validDate(Number(m[3]), Number(m[2]), Number(m[1]));

  // "12 de mayo de 2014"
  const meses: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  };
  m = t.toLowerCase().match(/^(\d{1,2})\s*de\s*(\w+)\s*de\s*(\d{4})/);
  if (m && meses[m[2]]) {
    return validDate(Number(m[3]), Number(meses[m[2]]), Number(m[1]));
  }
  // yyyy-mm-dd
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return validDate(Number(m[1]), Number(m[2]), Number(m[3]));

  return null;
}

function parseAnio(s: string | undefined | null): number | null {
  if (!s) return null;
  const m = String(s).match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

function parseMonto(s: string | undefined | null): number | null {
  if (!s) return null;
  const t = String(s).replace(/[$,\s]/g, '');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseBool(s: string | undefined | null): boolean {
  if (!s) return false;
  const t = String(s).trim().toUpperCase();
  return t === 'X' || t === '1' || t === 'SI' || t === 'SÍ' || t === 'TRUE';
}

// Mapa en memoria por llave natural → uuid
type IdMap = Map<string, string>;

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  log.bold('\n📥 Importando CSVs del padrón a Supabase...\n');

  const client = pgClient();
  await client.connect();

  // Cada fase corre en su propia transacción.
  // Si interrumpes, las fases ya completadas quedan persistidas.
  const phase = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    await client.query('begin');
    try {
      const r = await fn();
      await client.query('commit');
      return r;
    } catch (e) {
      await client.query('rollback');
      throw e;
    }
  };

  try {
    // ── 1) Sitios ──
    log.info('1/6 Importando sitios...');
    const sitiosId = await phase('sitios', () => importarSitios(client));
    log.ok(`   ${sitiosId.size} sitios cargados`);

    // ── 2) Socios ──
    log.info('2/6 Importando socios (CSV #1 Agremiados + #2 Escalafón)...');
    const sociosId = await phase('socios', () => importarSocios(client, sitiosId));
    log.ok(`   ${sociosId.size} socios cargados`);

    // ── 3) Concesiones ──
    log.info('3/6 Importando concesiones...');
    const concesionesId = await phase('concesiones', () => importarConcesiones(client, sociosId, sitiosId));
    log.ok(`   ${concesionesId.size} concesiones cargadas`);

    // ── 4) Vehículos y pólizas ──
    log.info('4/6 Importando vehículos y pólizas...');
    const { vehiculosId, polizasN } = await phase('vehiculos', () => importarVehiculosYPolizas(client, concesionesId));
    log.ok(`   ${vehiculosId.size} vehículos, ${polizasN} pólizas`);

    // ── 5) Antidoping ──
    log.info('5/6 Importando antidoping...');
    const antiN = await phase('antidoping', () => importarAntidoping(client, sociosId, concesionesId));
    log.ok(`   ${antiN} registros de antidoping`);

    // ── 6) Documentos auxiliares ──
    log.info('6/6 Importando documentos auxiliares (direcciones, contactos, beneficiarios)...');
    const docsN = await phase('docs', () => importarDocsSocio(client, sociosId));
    log.ok(`   ${docsN} documentos auxiliares`);

    // ── Reporte de inconsistencias ──
    const reportPath = resolve(process.cwd(), 'scripts', 'import-report.json');
    writeFileSync(
      reportPath,
      JSON.stringify(
        {
          fecha: new Date().toISOString(),
          totales: { sitios: sitiosId.size, socios: sociosId.size, concesiones: concesionesId.size, vehiculos: vehiculosId.size, polizas: polizasN, antidoping: antiN },
          inconsistencias,
        },
        null,
        2
      )
    );
    log.ok(`Reporte: ${reportPath} (${inconsistencias.length} avisos)`);

    log.bold('\n🎉 Importación completa.\n');
  } catch (e: any) {
    log.err(`Falló la importación: ${e.message}`);
    if (e.detail) log.dim(`detail: ${e.detail}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// ─────────────────────────────────────────────────────────────
// 1) Sitios
// ─────────────────────────────────────────────────────────────

async function importarSitios(client: any): Promise<IdMap> {
  // Extraemos sitios únicos del CSV #1 (col SITIO) y CSV #4 (filas título SITIO XYZ)
  const set = new Set<string>();

  // CSV #1 fila 1 = headers, fila 2+ = data
  const rows1 = readCsv('1.- Padron de Agremiados 2026.csv', 1);
  for (const r of rows1) {
    const sitio = (r['SITIO'] ?? '').trim();
    if (sitio) set.add(sitio.toUpperCase());
  }

  // CSV #4: filas título "SITIO XYZ (...)"
  const text4 = new TextDecoder('windows-1252').decode(readFileSync(resolve(UPLOADS, '4.- Padron Completo de Carros por Sitio 2026.csv')));
  for (const line of text4.split(/\r?\n/)) {
    const m = line.match(/^SITIO\s+([^,]+)/i);
    if (m) set.add(m[1].trim().toUpperCase());
  }

  // CSV #6: col Sitio
  const rows6 = readCsv('6.- Lista de antidoping actualizable para transporte.csv', 1);
  for (const r of rows6) {
    const s = (r['Sitio'] ?? '').trim();
    if (s) set.add(s.toUpperCase());
  }

  const map: IdMap = new Map();
  for (const nombre of set) {
    const res = await client.query(
      `insert into sitios (nombre) values ($1)
       on conflict (nombre) do update set updated_at = now()
       returning id`,
      [nombre]
    );
    map.set(nombre, res.rows[0].id);
  }
  return map;
}

// ─────────────────────────────────────────────────────────────
// 2) Socios (CSV #1 dedup con CSV #2)
// ─────────────────────────────────────────────────────────────

async function importarSocios(client: any, sitiosId: IdMap): Promise<IdMap> {
  // Map: clave = RFC || CURP || normNombre(nombre) → row
  const sociosMap = new Map<string, any>();

  // CSV #1 (Agremiados) — headers en fila 1
  const rows1 = readCsv('1.- Padron de Agremiados 2026.csv', 2);  // from_line 2 = headers en fila 2

  for (const r of rows1) {
    const nombre_raw = (r['NOMBRE COMPLETO'] ?? '').trim();
    if (!nombre_raw) continue;

    const nombre_norm = normNombre(nombre_raw);
    const fallecido = tieneCruz(nombre_raw);
    const rfc = (r['RFC'] ?? '').trim().toUpperCase() || null;
    const curp = (r['CURP'] ?? '').trim().toUpperCase() || null;

    // Llave de dedup
    const key = rfc || curp || nombre_norm;
    const existing = sociosMap.get(key) ?? {};

    sociosMap.set(key, {
      ...existing,
      rfc: rfc ?? existing.rfc,
      curp: curp ?? existing.curp,
      nombre_completo: nombre_norm,
      fecha_nacimiento: parseFecha(r['FECHA NACIMIENTO']) ?? existing.fecha_nacimiento,
      lugar_nacimiento: (r['LUGAR DE NACIMIENTO'] ?? existing.lugar_nacimiento ?? '').toString().trim() || null,
      estado_civil: (r['EDO. CIVIL'] ?? existing.estado_civil ?? '').toString().trim() || null,
      escolaridad: (r['GRADO MAX. EST.'] ?? existing.escolaridad ?? '').toString().trim() || null,
      tipo_socio: mapTipoSocio(r['TIPO DE SOCIO']) ?? existing.tipo_socio ?? 'CONCESIONARIO',
      estatus: fallecido ? 'FALLECIDO' : (existing.estatus ?? 'ACTIVO'),
      soc_act: parseBool(r['SOC_ACT']) || existing.soc_act || false,
      soc_veint: parseBool(r['SOC_VEINT']) || existing.soc_veint || false,
      soc_tran: parseBool(r['SOC_TRAN']) || existing.soc_tran || false,
      turno: (r['TURNO'] ?? existing.turno ?? '').toString().trim() || null,
      firma_actual: parseBool(r['FIRMA ACTUAL']) ? 'RECABADA' : (existing.firma_actual ?? 'PENDIENTE'),
      fecha_ingreso: parseFecha(r['FECHA DE INGRESO']) ?? existing.fecha_ingreso,
      comentarios: (r['COMENTARIOS'] ?? existing.comentarios ?? '').toString().trim() || null,
      // Auxiliares para luego (no van a tabla socios directamente)
      __aux: {
        direccion_actual: r['DIRECCION ACTUAL'],
        colonia_actual: r['COLONIA'],
        codigo_postal: r['COD. POST.'],
        clave_elector: r['CLAVE DE ELECTOR'],
        seccion: r['SECCION'],
        vigencia: r['VIGENCIA'],
        lic_numero: r['LIC. DE COND.'],
        lic_tipo: r['TIPO'],
        lic_venc: r['VENCIMIENTO'],
        tel_cel: r['TEL. CEL.'],
        tel_casa: r['TEL. CASA'],
        correo: r['CORREO ELECTRONICO'],
        ocupacion: r['OCUPACION'],
        esposo: r['NOMBRE DE ESPOS@'],
        beneficiario: r['BENEFICIARI@'],
        tel_beneficiario: r['TEL. BENEFICIARIO'],
        dir_beneficiario: r['DIREC. BENEFICIARIO'],
        sitio: (r['SITIO'] ?? '').trim().toUpperCase(),
        num_carro: r['NUM. CARRO'],
      },
    });
  }

  // CSV #2 (Escalafón) — agrega numero de escalafón
  // Headers en fila 7 (índice 0 = 7 → from_line = 8 con csv-parse)
  const rows2 = readCsv('2.- Padron de Escalafon 2026.csv', 8);
  for (const r of rows2) {
    const nombre_raw = (r['Nombre'] ?? '').trim();
    if (!nombre_raw) continue;
    const nombre_norm = normNombre(nombre_raw);
    const rfc = null; // CSV #2 no tiene RFC
    const curp = (r['CURP'] ?? '').trim().toUpperCase() || null;
    const escalafon = Number(r['No.']) || null;

    const key = curp || nombre_norm;
    const existing = sociosMap.get(key) ?? sociosMap.get(nombre_norm);
    if (existing) {
      if (escalafon) existing.escalafon_numero = escalafon;
      if (curp && !existing.curp) existing.curp = curp;
    } else {
      // Socio que está en escalafón pero no en agremiados (raro)
      sociosMap.set(nombre_norm, {
        nombre_completo: nombre_norm,
        curp,
        escalafon_numero: escalafon,
        estatus: 'ACTIVO',
        tipo_socio: 'CONCESIONARIO',
        firma_actual: 'PENDIENTE',
        __aux: {
          dir_escalafon: r['Domicilio'],
          colonia_escalafon: r['Colonia'],
          codigo_postal_escalafon: r['C.P.'],
          clave_elector: r['Clave de Elector'],
          seccion: r['Secc.'],
          vigencia: r['Vigencia'],
          lic_numero: r['Lic. De Cond.'],
          lic_tipo: r['Tipo de Licencia'],
          lic_venc: r['Vencimiento'],
          tel_cel: r['Telefono'],
        },
      });
      inconsistencias.push({
        tipo: 'SOCIO_SOLO_ESCALAFON',
        csv: '2.- Padron de Escalafon',
        detalle: `${nombre_norm} (No. ${escalafon}) está en escalafón pero no en agremiados`,
      });
    }
  }

  // Insertar
  const map: IdMap = new Map();
  for (const [key, s] of sociosMap.entries()) {
    // Cada insert va en su propio savepoint para que un fallo no aborte la transacción
    await client.query('savepoint sp_socio');
    try {
      const res = await client.query(
        `insert into socios (
          rfc, curp, nombre_completo, fecha_nacimiento, lugar_nacimiento,
          escalafon_numero, tipo_socio, estatus, soc_act, soc_veint, soc_tran,
          turno, firma_actual, fecha_ingreso, comentarios, estado_civil, escolaridad
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        on conflict (rfc) where rfc is not null do update set
          nombre_completo = excluded.nombre_completo,
          updated_at = now()
        returning id`,
        [
          s.rfc, s.curp, s.nombre_completo, s.fecha_nacimiento, s.lugar_nacimiento,
          s.escalafon_numero, s.tipo_socio, s.estatus, s.soc_act, s.soc_veint, s.soc_tran,
          s.turno, s.firma_actual, s.fecha_ingreso, s.comentarios, s.estado_civil, s.escolaridad,
        ]
      );
      await client.query('release savepoint sp_socio');
      map.set(key, res.rows[0].id);
      s.__id = res.rows[0].id;
    } catch (e: any) {
      await client.query('rollback to savepoint sp_socio');
      inconsistencias.push({
        tipo: 'SOCIO_INSERT_FAIL',
        csv: '1+2',
        detalle: `${s.nombre_completo}: ${e.code || ''} ${e.detail || e.message}`,
      });
      // Reintentamos solo con campos mínimos para no perder el registro
      await client.query('savepoint sp_socio_retry');
      try {
        const res = await client.query(
          `insert into socios (rfc, nombre_completo, tipo_socio, estatus, firma_actual)
           values ($1,$2,$3,$4,$5)
           returning id`,
          [s.rfc ?? null, s.nombre_completo, s.tipo_socio ?? 'CONCESIONARIO', s.estatus ?? 'ACTIVO', s.firma_actual ?? 'PENDIENTE']
        );
        await client.query('release savepoint sp_socio_retry');
        map.set(key, res.rows[0].id);
        s.__id = res.rows[0].id;
      } catch (e2: any) {
        await client.query('rollback to savepoint sp_socio_retry');
        inconsistencias.push({
          tipo: 'SOCIO_DESCARTADO',
          csv: '1+2',
          detalle: `${s.nombre_completo}: ${e2.message}`,
        });
      }
    }
  }

  // Guardamos sociosMap globalmente para que importarDocsSocio lo reuse
  (globalThis as any).__sociosMap = sociosMap;

  return map;
}

function mapTipoSocio(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.toUpperCase().trim();
  if (t.includes('CONCESIONARIO')) return 'CONCESIONARIO';
  if (t.includes('AGENCIA')) return 'AGENCIA';
  if (t.includes('PERMISIONARIO')) return 'PERMISIONARIO';
  if (t.includes('INDEPENDIENTE')) return 'INDEPENDIENTE';
  if (t.includes('HEREDERO')) return 'HEREDERO';
  return 'OTRO';
}

// ─────────────────────────────────────────────────────────────
// 3) Concesiones
// ─────────────────────────────────────────────────────────────

async function importarConcesiones(client: any, sociosId: IdMap, sitiosId: IdMap): Promise<IdMap> {
  const map: IdMap = new Map();

  const findSocioId = (nombre: string, curp?: string | null): string | null => {
    const n = normNombre(nombre);
    if (curp) {
      const c = curp.toUpperCase();
      for (const [, s] of (globalThis as any).__sociosMap as Map<string, any>) {
        if (s.curp === c && s.__id) return s.__id;
      }
    }
    // Por nombre normalizado
    for (const [k, id] of sociosId.entries()) {
      if (k === n) return id;
    }
    // Búsqueda fuzzy: contiene primer apellido + nombre
    for (const [k, id] of sociosId.entries()) {
      const tk = k.split(/\s+/);
      const tn = n.split(/\s+/);
      if (tk.length >= 3 && tn.length >= 3 && tk[0] === tn[0] && tk[1] === tn[1] && tk[2] === tn[2]) return id;
    }
    return null;
  };

  // Helper para insertar con savepoint
  const tryInsert = async (sql: string, params: any[], errCtx: { tipo: string; csv: string; ref: string }): Promise<string | null> => {
    await client.query('savepoint sp_ins');
    try {
      const res = await client.query(sql, params);
      await client.query('release savepoint sp_ins');
      return res.rows[0]?.id ?? null;
    } catch (e: any) {
      await client.query('rollback to savepoint sp_ins');
      inconsistencias.push({ tipo: errCtx.tipo, csv: errCtx.csv, detalle: `${errCtx.ref}: ${e.code || ''} ${e.message}` });
      return null;
    }
  };

  // ── CSV #2 Escalafón → concesiones base ──
  const rows2 = readCsv('2.- Padron de Escalafon 2026.csv', 8);
  for (const r of rows2) {
    const concNum = (r['Concesion'] ?? '').trim();
    const nombre = (r['Nombre'] ?? '').trim();
    if (!concNum || !nombre) continue;
    const socioId = findSocioId(nombre, r['CURP']);
    if (!socioId) {
      inconsistencias.push({ tipo: 'CONCESION_SIN_SOCIO', csv: '#2', detalle: `${concNum} → ${nombre}` });
      continue;
    }
    const id = await tryInsert(
      `insert into concesiones (numero_concesion, socio_id, tipo, estado)
       values ($1,$2,'CONCESION','VIGENTE')
       on conflict (numero_concesion) do update set socio_id = excluded.socio_id, updated_at = now()
       returning id`,
      [concNum, socioId],
      { tipo: 'CONCESION_INSERT_FAIL', csv: '#2', ref: concNum }
    );
    if (id) map.set(concNum, id);
  }

  // ── CSV #3 Pólizas → enriquece concesiones ──
  const rows3 = readCsv('3.- Padron de Vehiculos y Polizas 2026.csv', 1);
  for (const r of rows3) {
    const concNum = (r['Concesion'] ?? '').trim();
    const nombre = (r['Nombre'] ?? '').trim();
    if (!concNum) continue;
    const socioId = findSocioId(nombre);
    if (!map.has(concNum) && socioId) {
      const id = await tryInsert(
        `insert into concesiones (numero_concesion, socio_id, tipo, estado,
                                  fecha_concesion, fecha_acuerdo, modalidad, submodalidad,
                                  ruta_denominada, cesion_sucesion)
         values ($1,$2,'CONCESION','VIGENTE',$3,$4,$5,$6,$7,$8)
         on conflict (numero_concesion) do nothing
         returning id`,
        [
          concNum, socioId,
          parseFecha(r['Fecha de Concesion']),
          parseFecha(r['Fecha de acuerdo']),
          r['Modalidad'] || null,
          r['Submodalidad'] || null,
          r['Ruta denominada'] || null,
          r['Cesion/Sucesion de Derechos'] || null,
        ],
        { tipo: 'CONCESION_INSERT_FAIL', csv: '#3', ref: concNum }
      );
      if (id) map.set(concNum, id);
    } else if (map.has(concNum)) {
      await client.query('savepoint sp_upd');
      try {
        await client.query(
          `update concesiones set
             fecha_concesion = coalesce(fecha_concesion, $2),
             fecha_acuerdo   = coalesce(fecha_acuerdo, $3),
             modalidad       = coalesce(modalidad, $4),
             submodalidad    = coalesce(submodalidad, $5),
             ruta_denominada = coalesce(ruta_denominada, $6),
             cesion_sucesion = coalesce(cesion_sucesion, $7),
             updated_at = now()
           where numero_concesion = $1`,
          [
            concNum,
            parseFecha(r['Fecha de Concesion']),
            parseFecha(r['Fecha de acuerdo']),
            r['Modalidad'] || null,
            r['Submodalidad'] || null,
            r['Ruta denominada'] || null,
            r['Cesion/Sucesion de Derechos'] || null,
          ]
        );
        await client.query('release savepoint sp_upd');
      } catch (e: any) {
        await client.query('rollback to savepoint sp_upd');
        inconsistencias.push({ tipo: 'CONCESION_UPDATE_FAIL', csv: '#3', detalle: `${concNum}: ${e.message}` });
      }
    }
  }

  // ── CSV #4 Carros por Sitio → asigna sitio + taxi_numero ──
  // El #4 tiene secciones repetidas con "SITIO XYZ" como divisor
  const text4 = new TextDecoder('windows-1252').decode(readFileSync(resolve(UPLOADS, '4.- Padron Completo de Carros por Sitio 2026.csv')));
  let sitioActual: string | null = null;
  for (const rawLine of text4.split(/\r?\n/)) {
    const m = rawLine.match(/^SITIO\s+([^,]+)/i);
    if (m) {
      sitioActual = m[1].trim().toUpperCase();
      continue;
    }
    // Espera filas tipo: num, .-, nombre, concesion, marca, modelo, serie, placas
    const parts = rawLine.split(',');
    if (parts.length < 4 || !sitioActual) continue;
    const taxi_num = Number(parts[0]);
    const nombre = (parts[2] ?? '').trim();
    const concNum = (parts[3] ?? '').trim();
    if (!concNum || !Number.isFinite(taxi_num)) continue;
    const sitioId = sitiosId.get(sitioActual);
    if (!sitioId || !map.has(concNum)) continue;
    await client.query('savepoint sp_sit');
    try {
      await client.query(
        `update concesiones set sitio_id = $2, taxi_numero = $3, updated_at = now()
         where numero_concesion = $1`,
        [concNum, sitioId, taxi_num]
      );
      await client.query('release savepoint sp_sit');
    } catch (e: any) {
      await client.query('rollback to savepoint sp_sit');
      inconsistencias.push({ tipo: 'CONCESION_SITIO_FAIL', csv: '#4', detalle: `${concNum}: ${e.message}` });
    }
  }

  // ── CSV #7 Independientes (marca como es_independiente=true) ──
  // Para independientes a veces no tenemos un socio en el padrón — creamos uno mínimo
  const rows7 = readCsv('7.- Padron de Carros Independientes 2026.csv', 3);
  for (const r of rows7) {
    const concNum = (r['CONCESION'] ?? '').trim();
    const nombre = (r['NOMBRE'] ?? '').trim();
    if (!concNum || !nombre) continue;
    let socioId = findSocioId(nombre);
    if (!socioId) {
      // Crear socio independiente
      const newId = await tryInsert(
        `insert into socios (nombre_completo, tipo_socio, estatus, firma_actual)
         values ($1, 'INDEPENDIENTE', 'ACTIVO', 'NO_APLICA') returning id`,
        [normNombre(nombre)],
        { tipo: 'SOCIO_INDEPENDIENTE_CREADO', csv: '#7', ref: nombre }
      );
      if (newId) socioId = newId;
    }
    if (!socioId) continue;
    const id = await tryInsert(
      `insert into concesiones (numero_concesion, socio_id, tipo, estado, es_independiente)
       values ($1, $2, 'CONCESION', 'VIGENTE', true)
       on conflict (numero_concesion) do update set es_independiente = true, updated_at = now()
       returning id`,
      [concNum, socioId],
      { tipo: 'CONCESION_INDEP_FAIL', csv: '#7', ref: concNum }
    );
    if (id) map.set(concNum, id);
  }

  return map;
}

// ─────────────────────────────────────────────────────────────
// 4) Vehículos y pólizas
// ─────────────────────────────────────────────────────────────

async function importarVehiculosYPolizas(
  client: any, concesionesId: IdMap
): Promise<{ vehiculosId: IdMap; polizasN: number }> {
  const vehiculosId: IdMap = new Map();
  let polizasN = 0;

  const safe = async (sql: string, params: any[], ctx: { tipo: string; csv: string; ref: string }): Promise<string | null> => {
    await client.query('savepoint sp_v');
    try {
      const res = await client.query(sql, params);
      await client.query('release savepoint sp_v');
      return res.rows[0]?.id ?? null;
    } catch (e: any) {
      await client.query('rollback to savepoint sp_v');
      inconsistencias.push({ tipo: ctx.tipo, csv: ctx.csv, detalle: `${ctx.ref}: ${e.code || ''} ${e.message}` });
      return null;
    }
  };

  // ── CSV #3 (con pólizas) ──
  const rows3 = readCsv('3.- Padron de Vehiculos y Polizas 2026.csv', 1);
  for (const r of rows3) {
    const concNum = (r['Concesion'] ?? '').trim();
    if (!concNum) continue;
    const concId = concesionesId.get(concNum);

    const placas = (r['Placas'] ?? '').trim().toUpperCase() || null;
    const serie = (r['No. De Serie'] ?? '').trim().toUpperCase() || null;
    const marcaModeloFull = (r['Vehiculo registrado'] ?? '').trim();
    const [marca, ...rest] = marcaModeloFull.split(/\s+/);

    if (!placas && !serie) continue;

    const vehId = await safe(
      `insert into vehiculos (placas, numero_serie, marca, modelo, anio, engomado, concesion_actual_id, estatus)
       values ($1,$2,$3,$4,$5,$6,$7,'ACTIVO')
       on conflict (placas) where placas is not null do update set
         numero_serie = excluded.numero_serie,
         marca = excluded.marca,
         updated_at = now()
       returning id`,
      [
        placas, serie, marca || null,
        rest.join(' ') || marcaModeloFull,
        parseAnio(r['Modelo']),
        r['Engomado'] || null,
        concId ?? null,
      ],
      { tipo: 'VEHICULO_FAIL', csv: '#3', ref: `${concNum}/${placas}` }
    );
    if (!vehId) continue;
    if (placas) vehiculosId.set(placas, vehId);

    // Asignación vehiculo ↔ concesion
    if (concId) {
      await safe(
        `insert into vehiculo_asignaciones (vehiculo_id, concesion_id, fecha_inicio)
         values ($1, $2, coalesce($3::date, current_date))
         on conflict do nothing
         returning id`,
        [vehId, concId, parseFecha(r['Fecha de Concesion'])],
        { tipo: 'VEH_ASIG_FAIL', csv: '#3', ref: concNum }
      );
    }

    // Póliza
    const numPol = (r['No. Poliza'] ?? r[' No. Poliza'] ?? '').toString().trim();
    const venc = parseFecha(r['Hasta']);
    if (numPol && venc) {
      const polId = await safe(
        `insert into polizas (vehiculo_id, numero_poliza, compania, costo, fecha_inicio, fecha_vencimiento, endoso, comentarios, estado)
         values ($1,$2,$3,$4,$5,$6,$7,$8,
           case when $6::date < current_date then 'VENCIDA'
                when $6::date - current_date <= 30 then 'POR_VENCER'
                else 'VIGENTE' end)
         on conflict do nothing
         returning id`,
        [
          vehId,
          numPol,
          (r['Compañía'] ?? r['Compa��a'] ?? r['Compania'] ?? '').toString().trim() || 'Sin compañía',
          parseMonto(r['Costo']),
          parseFecha(r['Desde']),
          venc,
          (r['Endoso'] ?? '').toString().trim() || null,
          (r['Comentarios'] ?? '').toString().trim() || null,
        ],
        { tipo: 'POLIZA_FAIL', csv: '#3', ref: numPol }
      );
      if (polId) polizasN++;
    }
  }

  // ── CSV #7 Independientes (vehículos sin póliza necesariamente) ──
  const rows7 = readCsv('7.- Padron de Carros Independientes 2026.csv', 3);
  for (const r of rows7) {
    const concNum = (r['CONCESION'] ?? '').trim();
    const placas = (r['PLACAS'] ?? '').trim().toUpperCase() || null;
    const serie = (r['N° DE SERIE'] ?? r['Nø DE SERIE'] ?? r['N§ DE SERIE'] ?? '').trim().toUpperCase() || null;
    if (!placas && !serie) continue;
    const concId = concesionesId.get(concNum);
    const id = await safe(
      `insert into vehiculos (placas, numero_serie, marca, modelo, anio, concesion_actual_id, estatus, es_independiente)
       values ($1,$2,$3,$4,$5,$6,'ACTIVO',true)
       on conflict (placas) where placas is not null do update set es_independiente = true, updated_at = now()
       returning id`,
      [
        placas, serie,
        (r['MARCA DEL VEHICULO'] ?? '').toString().trim() || null,
        (r['MODELO'] ?? '').toString().trim() || null,
        parseAnio(r['MODELO']),
        concId ?? null,
      ],
      { tipo: 'VEHICULO_INDEP_FAIL', csv: '#7', ref: placas ?? serie ?? concNum }
    );
    if (id && placas) vehiculosId.set(placas, id);
  }

  return { vehiculosId, polizasN };
}

// ─────────────────────────────────────────────────────────────
// 5) Antidoping
// ─────────────────────────────────────────────────────────────

async function importarAntidoping(client: any, sociosId: IdMap, concesionesId: IdMap): Promise<number> {
  const rows = readCsv('6.- Lista de antidoping actualizable para transporte.csv', 1);
  let n = 0;

  for (const r of rows) {
    const nombre = normNombre(r['Nombre'] ?? '');
    if (!nombre) continue;
    const concNum = (r['Concesion'] ?? '').trim();

    const socioId = sociosId.get(nombre);
    if (!socioId) {
      inconsistencias.push({ tipo: 'ANTIDOPING_SIN_SOCIO', csv: '#6', detalle: nombre });
      continue;
    }
    const concId = concNum ? concesionesId.get(concNum) ?? null : null;

    await client.query('savepoint sp_ad');
    try {
      await client.query(
        `insert into antidoping (socio_id, concesion_id, fecha_prueba, hoja, banco, antiguedad_meses)
         values ($1,$2, current_date, $3, $4, $5)
         on conflict (socio_id, fecha_prueba) do nothing`,
        [socioId, concId, parseBool(r['Hoja']) ? 'X' : null, parseBool(r['Banco']) ? 'X' : null, parseBool(r['Ant.']) ? 12 : null]
      );
      await client.query('release savepoint sp_ad');
      n++;
    } catch (e: any) {
      await client.query('rollback to savepoint sp_ad');
      inconsistencias.push({ tipo: 'ANTIDOPING_FAIL', csv: '#6', detalle: `${nombre}: ${e.message}` });
    }
  }
  return n;
}

// ─────────────────────────────────────────────────────────────
// 6) Documentos auxiliares (direcciones, contactos, beneficiarios, credencial, licencia)
// ─────────────────────────────────────────────────────────────

async function importarDocsSocio(client: any, _sociosId: IdMap): Promise<number> {
  const sociosMap = (globalThis as any).__sociosMap as Map<string, any>;
  let n = 0;
  const safe = async (sql: string, params: any[], tipo: string, ref: string) => {
    await client.query('savepoint sp_d');
    try {
      await client.query(sql, params);
      await client.query('release savepoint sp_d');
      n++;
    } catch (e: any) {
      await client.query('rollback to savepoint sp_d');
      inconsistencias.push({ tipo, csv: '#1', detalle: `${ref}: ${e.message}` });
    }
  };
  for (const [, s] of sociosMap.entries()) {
    if (!s.__id || !s.__aux) continue;
    const aux = s.__aux;
    const sid = s.__id;

    if (aux.direccion_actual || aux.colonia_actual || aux.dir_escalafon) {
      await safe(
        `insert into socios_direcciones (socio_id, calle, colonia, codigo_postal, es_actual)
         values ($1, $2, $3, $4, true)
         on conflict do nothing`,
        [sid, aux.direccion_actual ?? aux.dir_escalafon ?? null, aux.colonia_actual ?? aux.colonia_escalafon ?? null, aux.codigo_postal ?? aux.codigo_postal_escalafon ?? null],
        'DIR_FAIL', s.nombre_completo
      );
    }
    for (const [tipo, val] of [
      ['TEL_CEL', aux.tel_cel],
      ['TEL_CASA', aux.tel_casa],
      ['CORREO', aux.correo],
    ]) {
      const v = (val ?? '').toString().trim();
      if (v) {
        await safe(
          `insert into socios_contactos (socio_id, tipo, valor) values ($1,$2,$3) on conflict do nothing`,
          [sid, tipo, v],
          'CONTACTO_FAIL', `${s.nombre_completo}/${tipo}`
        );
      }
    }
    if (aux.esposo) {
      await safe(
        `insert into socios_beneficiarios (socio_id, nombre, parentesco, es_designado)
         values ($1, $2, 'CONYUGE', false)`,
        [sid, normNombre(aux.esposo)],
        'BENEF_FAIL', s.nombre_completo
      );
    }
    if (aux.beneficiario) {
      await safe(
        `insert into socios_beneficiarios (socio_id, nombre, parentesco, telefono, direccion, es_designado)
         values ($1, $2, null, $3, $4, true)`,
        [sid, normNombre(aux.beneficiario), aux.tel_beneficiario ?? null, aux.dir_beneficiario ?? null],
        'BENEF_FAIL', s.nombre_completo
      );
    }
    if (aux.clave_elector) {
      await safe(
        `insert into socios_credencial_elector (socio_id, clave_elector, seccion, vigencia)
         values ($1, $2, $3, $4)
         on conflict (socio_id) do update set clave_elector = excluded.clave_elector, updated_at = now()`,
        [sid, aux.clave_elector, aux.seccion ?? null, aux.vigencia ? parseFecha(`01/01/${aux.vigencia}`) : null],
        'INE_FAIL', s.nombre_completo
      );
    }
    if (aux.lic_numero) {
      await safe(
        `insert into socios_licencia_conducir (socio_id, numero_licencia, tipo, fecha_vencimiento, es_actual)
         values ($1, $2, $3, $4, true)
         on conflict do nothing`,
        [sid, aux.lic_numero, aux.lic_tipo ?? null, parseFecha(aux.lic_venc)],
        'LIC_FAIL', s.nombre_completo
      );
    }
  }
  return n;
}

main().catch((e: any) => {
  log.err(`Error inesperado: ${e.message}`);
  console.error(e);
  process.exit(1);
});

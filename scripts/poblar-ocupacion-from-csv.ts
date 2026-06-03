/**
 * Puebla `socios.ocupacion` desde el CSV `uploads/1.- Padron de Agremiados 2026.csv`.
 *
 * Match en cascada:
 *   1) RFC del CSV  →  socios.rfc (upper)
 *   2) CURP del CSV →  socios.curp (upper)
 *   3) Nombre normalizado del CSV → nombre normalizado del socio (en memoria)
 *
 * Si paso 3 encuentra >1 socio → omite y reporta como `nombre_ambiguo`.
 * Si los 3 pasos no encuentran nada → reporta como `socio_no_encontrado`.
 * Si el valor de `ocupacion` ya coincide → omite (idempotente).
 *
 * Uso:
 *   pnpm tsx scripts/poblar-ocupacion-from-csv.ts            # dry-run
 *   pnpm tsx scripts/poblar-ocupacion-from-csv.ts --apply
 */

import { pgClient } from './_utils';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

const APPLY = process.argv.includes('--apply');
const UPLOADS = resolve(process.cwd(), 'uploads');
const CSV_FILE = '1.- Padron de Agremiados 2026.csv';

function normalizar(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\([^)]*\)/g, '')   // quita (+), (BAJA), etc.
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface SocioRow {
  id: string;
  rfc: string | null;
  curp: string | null;
  nombre_completo: string;
  ocupacion: string | null;
}

interface ReporteFila {
  csv_nombre: string;
  csv_rfc: string | null;
  csv_ocupacion: string;
  match: 'rfc' | 'curp' | 'nombre' | 'nombre_ambiguo' | 'no_encontrado' | 'sin_ocupacion' | 'sin_cambio';
  socio_id?: string;
  ocupacion_anterior?: string | null;
  hits_nombre?: number;
}

async function main() {
  const csvPath = resolve(UPLOADS, CSV_FILE);
  const bytes = readFileSync(csvPath);
  const text = new TextDecoder('windows-1252').decode(bytes);
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
    from_line: 2,   // la fila 1 tiene numeración (0, 1, 2…); el header real está en la 2
  }) as Record<string, string>[];

  console.log(`${APPLY ? '⚠️  APPLY' : '👀 DRY-RUN'}`);
  console.log(`CSV: ${records.length} filas\n`);

  const pg = pgClient();
  await pg.connect();

  // Carga índice de socios en memoria (1249 filas — barato)
  const { rows: socios } = await pg.query<SocioRow>(
    `select id, rfc, curp, nombre_completo, ocupacion from socios`,
  );
  const byRfc = new Map<string, SocioRow>();
  const byCurp = new Map<string, SocioRow>();
  const byNorm = new Map<string, SocioRow[]>();
  for (const s of socios) {
    if (s.rfc) byRfc.set(s.rfc.trim().toUpperCase(), s);
    if (s.curp) byCurp.set(s.curp.trim().toUpperCase(), s);
    const norm = normalizar(s.nombre_completo);
    if (norm.length >= 6) {
      (byNorm.get(norm) ?? byNorm.set(norm, []).get(norm)!).push(s);
    }
  }

  const reporte: ReporteFila[] = [];
  const stats = {
    procesadas: 0,
    sin_ocupacion: 0,
    ya_igual: 0,
    actualizadas: 0,
    matched_rfc: 0,
    matched_curp: 0,
    matched_nombre: 0,
    ambiguos: 0,
    no_encontrados: 0,
  };

  await pg.query('begin');
  try {
    for (const r of records) {
      const csvNombre = (r['NOMBRE COMPLETO'] ?? '').trim();
      const csvRfc = (r['RFC'] ?? '').trim().toUpperCase();
      const csvCurp = (r['CURP'] ?? '').trim().toUpperCase();
      const csvOcup = (r['OCUPACION'] ?? '').trim();
      stats.procesadas++;

      if (!csvOcup) {
        stats.sin_ocupacion++;
        continue;
      }

      let hit: SocioRow | null = null;
      let matchTipo: ReporteFila['match'] = 'no_encontrado';

      if (csvRfc && byRfc.has(csvRfc)) {
        hit = byRfc.get(csvRfc)!;
        matchTipo = 'rfc';
        stats.matched_rfc++;
      } else if (csvCurp && byCurp.has(csvCurp)) {
        hit = byCurp.get(csvCurp)!;
        matchTipo = 'curp';
        stats.matched_curp++;
      } else {
        const norm = normalizar(csvNombre);
        const candidatos = norm ? byNorm.get(norm) ?? [] : [];
        if (candidatos.length === 1) {
          hit = candidatos[0]!;
          matchTipo = 'nombre';
          stats.matched_nombre++;
        } else if (candidatos.length > 1) {
          matchTipo = 'nombre_ambiguo';
          stats.ambiguos++;
          reporte.push({
            csv_nombre: csvNombre, csv_rfc: csvRfc || null,
            csv_ocupacion: csvOcup, match: matchTipo, hits_nombre: candidatos.length,
          });
          continue;
        } else {
          stats.no_encontrados++;
          reporte.push({
            csv_nombre: csvNombre, csv_rfc: csvRfc || null,
            csv_ocupacion: csvOcup, match: 'no_encontrado',
          });
          continue;
        }
      }

      if (hit.ocupacion && hit.ocupacion.trim() === csvOcup) {
        stats.ya_igual++;
        reporte.push({
          csv_nombre: csvNombre, csv_rfc: csvRfc || null,
          csv_ocupacion: csvOcup, match: 'sin_cambio',
          socio_id: hit.id, ocupacion_anterior: hit.ocupacion,
        });
        continue;
      }

      await pg.query(
        `update socios set ocupacion = $1 where id = $2`,
        [csvOcup, hit.id],
      );
      stats.actualizadas++;
      reporte.push({
        csv_nombre: csvNombre, csv_rfc: csvRfc || null,
        csv_ocupacion: csvOcup, match: matchTipo,
        socio_id: hit.id, ocupacion_anterior: hit.ocupacion,
      });
    }

    if (APPLY) await pg.query('commit');
    else await pg.query('rollback');
  } catch (e) {
    await pg.query('rollback');
    throw e;
  }
  await pg.end();

  const outPath = resolve(process.cwd(), 'scripts/ocupacion-report.json');
  writeFileSync(outPath, JSON.stringify({ stats, reporte }, null, 2), 'utf-8');

  console.log('📊 Resumen:');
  console.log(`   CSV filas procesadas:        ${stats.procesadas}`);
  console.log(`   Sin ocupación en CSV:        ${stats.sin_ocupacion}`);
  console.log(`   Match por RFC:               ${stats.matched_rfc}`);
  console.log(`   Match por CURP:              ${stats.matched_curp}`);
  console.log(`   Match por nombre:            ${stats.matched_nombre}`);
  console.log(`   Nombre ambiguo (omitido):    ${stats.ambiguos}`);
  console.log(`   No encontrado en BD:         ${stats.no_encontrados}`);
  console.log(`   Sin cambio (ya = CSV):       ${stats.ya_igual}`);
  console.log(`   ─────────────`);
  console.log(`   Actualizadas:                ${stats.actualizadas}`);
  console.log(`\n📄 Reporte: ${outPath}`);
  console.log(APPLY ? '\n✅ Cambios persistidos.' : '\n👀 Dry-run — usa --apply.');
}

main().catch((e) => { console.error('❌', e); process.exit(1); });

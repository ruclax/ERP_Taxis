/**
 * Puebla `socios.escalafon_numero` + `socios.tipo_escalafon` desde el CSV
 * `2.- Padron de Escalafon 2026.csv`.
 *
 * Reglas de match:
 *   - Si la fila tiene número de Concesión → match por `concesiones.numero_concesion`
 *     y asigna `tipo_escalafon = 'CONCESIONARIO'` al socio titular.
 *   - Si NO tiene concesión → match por nombre normalizado, luego por CURP
 *     y asigna `tipo_escalafon = 'ASPIRANTE'`.
 *
 * Idempotente: si el socio ya tiene exactamente esos valores, no toca.
 * Reporta colisiones (mismo tipo + número en otro socio) y ambiguos por nombre.
 *
 * Uso:
 *   pnpm tsx scripts/poblar-escalafon-from-csv.ts            # dry-run
 *   pnpm tsx scripts/poblar-escalafon-from-csv.ts --apply
 */

import { pgClient } from './_utils';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

const APPLY = process.argv.includes('--apply');
const CSV_FILE = '2.- Padron de Escalafon 2026.csv';

function normalizar(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\([^)]*\)/g, '')
    .toUpperCase()
    .replace(/¥|¤/g, 'Ñ')
    .replace(/[^A-ZÑ0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type Tipo = 'CONCESIONARIO' | 'ASPIRANTE';

interface SocioRow {
  id: string;
  curp: string | null;
  nombre_completo: string;
  escalafon_numero: number | null;
  tipo_escalafon: string;
}

interface ReporteFila {
  csv_concesion: string;
  csv_nombre: string;
  csv_escalafon: string;
  tipo_objetivo: Tipo;
  match: 'concesion' | 'curp' | 'nombre' | 'nombre_ambiguo' | 'no_encontrado' | 'sin_numero' | 'colision_unique' | 'sin_cambio';
  socio_id?: string;
  esc_anterior?: number | null;
  hits_nombre?: number;
  error?: string;
}

async function main() {
  const bytes = readFileSync(resolve('uploads', CSV_FILE));
  const text = new TextDecoder('windows-1252').decode(bytes);
  const records = parse(text, {
    columns: true, skip_empty_lines: true,
    relax_quotes: true, relax_column_count: true, trim: true,
    from_line: 8,
  }) as Record<string, string>[];

  console.log(`${APPLY ? '⚠️  APPLY' : '👀 DRY-RUN'}`);
  console.log(`CSV: ${records.length} filas\n`);

  const pg = pgClient();
  await pg.connect();

  // Índice de socios y concesiones en memoria
  const { rows: socios } = await pg.query<SocioRow>(
    `select id, curp, nombre_completo, escalafon_numero, tipo_escalafon from socios`,
  );
  const byCurp = new Map<string, SocioRow>();
  const byNorm = new Map<string, SocioRow[]>();
  for (const s of socios) {
    if (s.curp) byCurp.set(s.curp.trim().toUpperCase(), s);
    const n = normalizar(s.nombre_completo);
    if (n.length >= 6) (byNorm.get(n) ?? byNorm.set(n, []).get(n)!).push(s);
  }

  const { rows: concs } = await pg.query<{ numero_concesion: string; socio_id: string }>(
    `select numero_concesion, socio_id from concesiones`,
  );
  const byConc = new Map<string, string>();
  for (const c of concs) byConc.set(c.numero_concesion.trim().toUpperCase(), c.socio_id);

  const reporte: ReporteFila[] = [];
  const stats = {
    procesadas: 0,
    sin_numero: 0,
    match_concesion: 0,
    match_curp: 0,
    match_nombre: 0,
    ambiguos: 0,
    no_encontrados: 0,
    actualizados: 0,
    sin_cambio: 0,
    colisiones_unique: 0,
  };

  await pg.query('begin');
  try {
    for (const r of records) {
      stats.procesadas++;
      const csvConc = (r['Concesion'] ?? '').trim().toUpperCase();
      const csvEsc = parseInt((r['No.'] ?? '').trim() || '');
      const csvNombre = (r['Nombre'] ?? '').trim();
      const csvCurp = (r['CURP'] ?? '').trim().toUpperCase();
      if (isNaN(csvEsc)) { stats.sin_numero++; continue; }

      const tipo: Tipo = csvConc ? 'CONCESIONARIO' : 'ASPIRANTE';

      // Match
      let socioId: string | undefined;
      let match: ReporteFila['match'] = 'no_encontrado';

      if (csvConc) {
        socioId = byConc.get(csvConc);
        if (socioId) { match = 'concesion'; stats.match_concesion++; }
      }
      if (!socioId && csvCurp && csvCurp.length >= 16) {
        const hit = byCurp.get(csvCurp);
        if (hit) { socioId = hit.id; match = 'curp'; stats.match_curp++; }
      }
      if (!socioId) {
        const n = normalizar(csvNombre);
        const cands = n ? byNorm.get(n) ?? [] : [];
        if (cands.length === 1) {
          socioId = cands[0]!.id; match = 'nombre'; stats.match_nombre++;
        } else if (cands.length > 1) {
          match = 'nombre_ambiguo'; stats.ambiguos++;
          reporte.push({
            csv_concesion: csvConc, csv_nombre: csvNombre, csv_escalafon: String(csvEsc),
            tipo_objetivo: tipo, match, hits_nombre: cands.length,
          });
          continue;
        }
      }
      if (!socioId) {
        stats.no_encontrados++;
        reporte.push({
          csv_concesion: csvConc, csv_nombre: csvNombre, csv_escalafon: String(csvEsc),
          tipo_objetivo: tipo, match: 'no_encontrado',
        });
        continue;
      }

      const actual = socios.find((s) => s.id === socioId)!;
      if (actual.escalafon_numero === csvEsc && actual.tipo_escalafon === tipo) {
        stats.sin_cambio++;
        continue;
      }

      // UPDATE con savepoint para tolerar colisiones de UNIQUE
      await pg.query('savepoint sp');
      try {
        await pg.query(
          `update socios set escalafon_numero = $1, tipo_escalafon = $2 where id = $3`,
          [csvEsc, tipo, socioId],
        );
        await pg.query('release savepoint sp');
        // Actualiza el índice en memoria para no chocar consigo mismo en próximas filas
        actual.escalafon_numero = csvEsc;
        actual.tipo_escalafon = tipo;
        stats.actualizados++;
        reporte.push({
          csv_concesion: csvConc, csv_nombre: csvNombre, csv_escalafon: String(csvEsc),
          tipo_objetivo: tipo, match, socio_id: socioId,
          esc_anterior: actual.escalafon_numero,
        });
      } catch (e) {
        await pg.query('rollback to savepoint sp');
        const err = e as { code?: string; message?: string };
        stats.colisiones_unique++;
        reporte.push({
          csv_concesion: csvConc, csv_nombre: csvNombre, csv_escalafon: String(csvEsc),
          tipo_objetivo: tipo, match: 'colision_unique', socio_id: socioId,
          error: `[${err.code ?? '?'}] ${err.message ?? ''}`,
        });
      }
    }

    if (APPLY) await pg.query('commit');
    else await pg.query('rollback');
  } catch (e) {
    await pg.query('rollback');
    throw e;
  }
  await pg.end();

  const outPath = resolve('scripts/escalafon-report.json');
  writeFileSync(outPath, JSON.stringify({ stats, reporte }, null, 2), 'utf-8');

  console.log('📊 Resumen:');
  console.log(`   CSV filas procesadas:        ${stats.procesadas}`);
  console.log(`   Sin número de escalafón:     ${stats.sin_numero}`);
  console.log(`   Match por concesión:         ${stats.match_concesion}  → CONCESIONARIO`);
  console.log(`   Match por CURP:              ${stats.match_curp}`);
  console.log(`   Match por nombre:            ${stats.match_nombre}`);
  console.log(`   Ambiguo por nombre:          ${stats.ambiguos}`);
  console.log(`   No encontrado:               ${stats.no_encontrados}`);
  console.log(`   Colisión UNIQUE:             ${stats.colisiones_unique}`);
  console.log(`   Sin cambio (ya = CSV):       ${stats.sin_cambio}`);
  console.log(`   ─────────────`);
  console.log(`   Actualizados:                ${stats.actualizados}`);
  console.log(`\n📄 Reporte: ${outPath}`);
  console.log(APPLY ? '\n✅ Cambios persistidos.' : '\n👀 Dry-run — usa --apply.');
}

main().catch((e) => { console.error('❌', e); process.exit(1); });

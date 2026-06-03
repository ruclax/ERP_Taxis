/**
 * Puebla `socios.tipo_padron` desde el CSV "1.- Padron de Agremiados 2026.csv"
 * (columna "TIPO DE SOCIO").
 *
 * Normalización de valores:
 *   "CONCESIONARIO" | "CONCESIONARIA" | "CONCECIONARIA" → CONCESIONARIO
 *   "TRANSITORIO"                                       → TRANSITORIO
 *   "25%" | "25 %"                                      → CUOTA_25
 *   ""                                                  → null (no se actualiza)
 *
 * Match en cascada: RFC → CURP → nombre normalizado.
 *
 * Uso:
 *   pnpm tsx scripts/poblar-tipo-padron-from-csv.ts            # dry-run
 *   pnpm tsx scripts/poblar-tipo-padron-from-csv.ts --apply
 */

import { pgClient } from './_utils';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

const APPLY = process.argv.includes('--apply');
const CSV_PATH = 'C:/Users/danie/Documents/Sindicato/Plataforma admin/1.- Padron de Agremiados 2026.csv';

type Tipo = 'CONCESIONARIO' | 'TRANSITORIO' | 'CUOTA_25';

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\([^)]*\)/g, '')
    .toUpperCase().replace(/¥|¤/g, 'Ñ')
    .replace(/[^A-ZÑ0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function clasificar(raw: string): Tipo | null {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!v) return null;
  if (v.startsWith('CONCE') || v.startsWith('CONSE')) return 'CONCESIONARIO';
  if (v === 'TRANSITORIO') return 'TRANSITORIO';
  if (v === '25%' || v === '25%' || v.replace(/\s/g, '') === '25%') return 'CUOTA_25';
  return null;
}

async function main() {
  const bytes = readFileSync(CSV_PATH);
  const text = new TextDecoder('windows-1252').decode(bytes);
  const records = parse(text, {
    columns: true, skip_empty_lines: true,
    relax_quotes: true, relax_column_count: true, trim: true, from_line: 2,
  }) as Record<string, string>[];

  console.log(`${APPLY ? '⚠️  APPLY' : '👀 DRY-RUN'}`);
  console.log(`CSV: ${records.length} filas\n`);

  const pg = pgClient();
  await pg.connect();

  // Cargar socios en memoria
  const { rows: socios } = await pg.query<{ id: string; rfc: string | null; curp: string | null; nombre_completo: string; tipo_padron: string | null }>(
    `select id, rfc, curp, nombre_completo, tipo_padron from socios`,
  );
  const byRfc = new Map<string, typeof socios[number]>();
  const byCurp = new Map<string, typeof socios[number]>();
  const byNorm = new Map<string, typeof socios[number][]>();
  for (const s of socios) {
    if (s.rfc) byRfc.set(s.rfc.trim().toUpperCase(), s);
    if (s.curp) byCurp.set(s.curp.trim().toUpperCase(), s);
    const n = normalizar(s.nombre_completo);
    if (n.length >= 6) (byNorm.get(n) ?? byNorm.set(n, []).get(n)!).push(s);
  }

  const stats = {
    procesadas: 0, sin_tipo: 0, sin_clasif: 0,
    match_rfc: 0, match_curp: 0, match_nombre: 0,
    ambiguos: 0, no_encontrados: 0,
    actualizados: 0, sin_cambio: 0,
    por_tipo: { CONCESIONARIO: 0, TRANSITORIO: 0, CUOTA_25: 0 } as Record<Tipo, number>,
  };
  const reporte: Array<{ csv_nombre: string; csv_rfc: string; csv_tipo: string; tipo: Tipo | null; match: string }> = [];

  await pg.query('begin');
  try {
    for (const r of records) {
      stats.procesadas++;
      const csvNombre = (r['NOMBRE COMPLETO'] ?? '').trim();
      const csvRfc = (r['RFC'] ?? '').trim().toUpperCase();
      const csvCurp = (r['CURP'] ?? '').trim().toUpperCase();
      const csvTipoRaw = (r['TIPO DE SOCIO'] ?? '').trim();

      if (!csvTipoRaw) { stats.sin_tipo++; continue; }

      const tipo = clasificar(csvTipoRaw);
      if (!tipo) {
        stats.sin_clasif++;
        reporte.push({ csv_nombre: csvNombre, csv_rfc: csvRfc, csv_tipo: csvTipoRaw, tipo: null, match: 'sin_clasif' });
        continue;
      }

      // Match
      let hit: typeof socios[number] | undefined;
      let matchT = 'no_encontrado';
      if (csvRfc && byRfc.has(csvRfc)) { hit = byRfc.get(csvRfc); matchT = 'rfc'; stats.match_rfc++; }
      else if (csvCurp && csvCurp.length >= 16 && byCurp.has(csvCurp)) { hit = byCurp.get(csvCurp); matchT = 'curp'; stats.match_curp++; }
      else {
        const n = normalizar(csvNombre);
        const c = n ? byNorm.get(n) ?? [] : [];
        if (c.length === 1) { hit = c[0]; matchT = 'nombre'; stats.match_nombre++; }
        else if (c.length > 1) { stats.ambiguos++; reporte.push({ csv_nombre: csvNombre, csv_rfc: csvRfc, csv_tipo: csvTipoRaw, tipo, match: 'ambiguo' }); continue; }
        else { stats.no_encontrados++; reporte.push({ csv_nombre: csvNombre, csv_rfc: csvRfc, csv_tipo: csvTipoRaw, tipo, match: 'no_encontrado' }); continue; }
      }
      if (!hit) continue;

      if (hit.tipo_padron === tipo) { stats.sin_cambio++; continue; }

      await pg.query(`update socios set tipo_padron = $1 where id = $2`, [tipo, hit.id]);
      hit.tipo_padron = tipo;
      stats.actualizados++;
      stats.por_tipo[tipo]++;
    }

    if (APPLY) await pg.query('commit');
    else await pg.query('rollback');
  } catch (e) {
    await pg.query('rollback');
    throw e;
  }
  await pg.end();

  writeFileSync(resolve('scripts/tipo-padron-report.json'), JSON.stringify({ stats, reporte }, null, 2));

  console.log('📊 Resumen:');
  console.log(`   CSV filas:               ${stats.procesadas}`);
  console.log(`   Sin tipo en CSV:         ${stats.sin_tipo}`);
  console.log(`   No clasificables:        ${stats.sin_clasif}`);
  console.log(`   Match RFC/CURP/nombre:   ${stats.match_rfc} / ${stats.match_curp} / ${stats.match_nombre}`);
  console.log(`   Ambiguos por nombre:     ${stats.ambiguos}`);
  console.log(`   No encontrados:          ${stats.no_encontrados}`);
  console.log(`   Sin cambio (ya = CSV):   ${stats.sin_cambio}`);
  console.log(`   ─────────────`);
  console.log(`   Actualizados:            ${stats.actualizados}`);
  for (const t of ['CONCESIONARIO','TRANSITORIO','CUOTA_25'] as const) {
    console.log(`     ${t.padEnd(15)} ${stats.por_tipo[t]}`);
  }
  console.log(APPLY ? '\n✅ Persistido.' : '\n👀 Dry-run — usa --apply.');
}

main().catch(e => { console.error('❌', e); process.exit(1); });

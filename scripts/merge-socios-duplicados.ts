/**
 * Fusiona socios duplicados detectados por `detect-socios-duplicados.ts`.
 *
 * Para cada grupo de confianza ≥ 85:
 *   1. Identifica canonical (más completo) y duplicados.
 *   2. Copia al canonical los campos no nulos que solo el duplicado tenga.
 *   3. Mueve TODAS las FK del duplicado al canonical (UPDATE en cada tabla).
 *   4. Borra el duplicado.
 *
 * Todo dentro de una transacción por par. Si algo falla, rollback.
 *
 * Uso:
 *   pnpm tsx scripts/merge-socios-duplicados.ts                # dry-run (default)
 *   pnpm tsx scripts/merge-socios-duplicados.ts --apply        # ejecuta de verdad
 *   pnpm tsx scripts/merge-socios-duplicados.ts --min-confianza 100   # solo RFC/CURP exacto
 */

import { pgClient } from './_utils';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Client } from 'pg';

const APPLY = process.argv.includes('--apply');
const minIdx = process.argv.indexOf('--min-confianza');
const MIN_CONFIANZA = minIdx >= 0 ? Number(process.argv[minIdx + 1]) : 85;
const limIdx = process.argv.indexOf('--limit');
const LIMIT = limIdx >= 0 ? Number(process.argv[limIdx + 1]) : Infinity;

interface Grupo {
  confianza: number;
  motivo: string;
  candidato_canonical_id: string;
  socios: Array<{
    id: string;
    rfc: string | null;
    curp: string | null;
    nombre_completo: string;
    fecha_nacimiento: string | null;
    escalafon_numero: number | null;
    tipo_socio: string;
    estatus: string;
    fecha_ingreso: string | null;
    n_concesiones: number;
    n_contratos_chofer: number;
  }>;
}

/**
 * FK_REFS — para cada tabla que apunta a socios, su columna y constraints
 *   uniqueSocio:  el socio aparece solo una vez en la tabla
 *   uniqueWith:   UNIQUE compuesto con esas columnas además del socio
 *   partialActive: UNIQUE parcial "WHERE es_actual = true" (solo una "actual")
 */
const FK_REFS: Array<{
  tabla: string;
  columna: string;
  uniqueSocio?: boolean;
  uniqueWith?: string[];
  partialActive?: boolean;
}> = [
  { tabla: 'sitios',                    columna: 'delegado_socio_id' },
  { tabla: 'concesiones',               columna: 'socio_id' },
  { tabla: 'socios_direcciones',        columna: 'socio_id', uniqueWith: ['tipo'], partialActive: true },
  { tabla: 'socios_contactos',          columna: 'socio_id' },
  { tabla: 'socios_beneficiarios',      columna: 'socio_id' },
  { tabla: 'socios_credencial_elector', columna: 'socio_id', uniqueSocio: true },
  { tabla: 'socios_licencia_conducir',  columna: 'socio_id', partialActive: true },
  { tabla: 'antidoping',                columna: 'socio_id', uniqueWith: ['fecha_prueba'] },
  { tabla: 'historial_choferes',        columna: 'chofer_socio_id' },
  { tabla: 'historial_choferes',        columna: 'asignado_por_socio_id' },
  { tabla: 'tesoreria_movimientos',     columna: 'socio_id' },
  { tabla: 'adeudos',                   columna: 'socio_id' },
  { tabla: 'funerario_inscripciones',   columna: 'socio_id' },
  { tabla: 'funerario_servicios',       columna: 'socio_titular_id' },
  { tabla: 'bitacora_accidentes',       columna: 'chofer_socio_id' },
  { tabla: 'bitacora_accidentes',       columna: 'responsable_socio_id' },
  { tabla: 'casos_honor_justicia',      columna: 'socio_consignado_id' },
  { tabla: 'casos_honor_justicia',      columna: 'consignado_por_socio_id' },
  { tabla: 'sanciones_sitio',           columna: 'socio_sancionado_id' },
  { tabla: 'sanciones_sitio',           columna: 'delegado_socio_id' },
  { tabla: 'mensualidades_cuotas',      columna: 'socio_id' },
  { tabla: 'concesion_choferes',        columna: 'chofer_socio_id' },
];

const CAMPOS_COPIABLES = [
  'rfc', 'curp', 'fecha_nacimiento', 'escalafon_numero',
  'fecha_ingreso', 'turno', 'comentarios', 'ocupacion',
];

interface MergeStats {
  socio_dup_id: string;
  socio_canon_id: string;
  campos_copiados: string[];
  fks_movidas: Record<string, number>;
  skipped_unique: string[];
  ok: boolean;
  error?: string;
}

async function mergePar(pg: Client, dupId: string, canonId: string): Promise<MergeStats> {
  const stats: MergeStats = {
    socio_dup_id: dupId,
    socio_canon_id: canonId,
    campos_copiados: [],
    fks_movidas: {},
    skipped_unique: [],
    ok: false,
  };

  try {
    await pg.query('begin');

    // 1) Copiar campos donde canonical es null y dup tiene valor
    const { rows: [canon] } = await pg.query(
      `select ${CAMPOS_COPIABLES.join(', ')} from socios where id = $1`, [canonId],
    );
    const { rows: [dup] } = await pg.query(
      `select ${CAMPOS_COPIABLES.join(', ')} from socios where id = $1`, [dupId],
    );
    if (!canon || !dup) throw new Error(`No se encontró canon=${canonId} o dup=${dupId}`);

    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const c of CAMPOS_COPIABLES) {
      if ((canon[c] == null || canon[c] === '') && dup[c] != null && dup[c] !== '') {
        sets.push(`${c} = $${vals.length + 1}`);
        vals.push(dup[c]);
        stats.campos_copiados.push(c);
      }
    }
    if (sets.length > 0) {
      vals.push(canonId);
      await pg.query(`update socios set ${sets.join(', ')} where id = $${vals.length}`, vals);
    }

    // 2) Mover FKs (manejando UNIQUE compuestos y parciales)
    for (const fk of FK_REFS) {
      // a) UNIQUE puro de un socio por tabla (ej. credencial_elector)
      if (fk.uniqueSocio) {
        const { rows: [conflict] } = await pg.query(
          `select id from ${fk.tabla} where ${fk.columna} = $1`, [canonId],
        );
        if (conflict) {
          const r = await pg.query(`delete from ${fk.tabla} where ${fk.columna} = $1`, [dupId]);
          if (r.rowCount && r.rowCount > 0) {
            stats.skipped_unique.push(`${fk.tabla} (${r.rowCount} del dup eliminada; canonical ya tenía)`);
          }
          continue;
        }
      }

      // b) UNIQUE compuesto (socio_id, col1, col2…) — borrar del dup las filas en colisión
      if (fk.uniqueWith && fk.uniqueWith.length > 0) {
        const cols = fk.uniqueWith.join(', ');
        const r = await pg.query(
          `delete from ${fk.tabla}
             where ${fk.columna} = $1
               and (${cols}) in (select ${cols} from ${fk.tabla} where ${fk.columna} = $2)`,
          [dupId, canonId],
        );
        if (r.rowCount && r.rowCount > 0) {
          stats.skipped_unique.push(`${fk.tabla} (${r.rowCount} del dup eliminada por colisión en ${cols})`);
        }
      }

      // c) UNIQUE parcial "WHERE es_actual = true" — si ambos tienen actual, desactivar la del dup
      if (fk.partialActive) {
        const { rows: [canonActual] } = await pg.query(
          `select id from ${fk.tabla} where ${fk.columna} = $1 and es_actual = true limit 1`, [canonId],
        );
        if (canonActual) {
          const r = await pg.query(
            `update ${fk.tabla} set es_actual = false where ${fk.columna} = $1 and es_actual = true`,
            [dupId],
          );
          if (r.rowCount && r.rowCount > 0) {
            stats.skipped_unique.push(`${fk.tabla} (${r.rowCount} "actual" del dup → false; canonical ya tenía actual)`);
          }
        }
      }

      // d) Update final: mueve las filas restantes del dup al canonical
      const r = await pg.query(
        `update ${fk.tabla} set ${fk.columna} = $1 where ${fk.columna} = $2`,
        [canonId, dupId],
      );
      if (r.rowCount && r.rowCount > 0) {
        stats.fks_movidas[`${fk.tabla}.${fk.columna}`] = r.rowCount;
      }
    }

    // 3) Borrar el dup
    await pg.query(`delete from socios where id = $1`, [dupId]);

    if (APPLY) {
      await pg.query('commit');
    } else {
      await pg.query('rollback');
    }
    stats.ok = true;
    return stats;
  } catch (e) {
    await pg.query('rollback');
    stats.error = (e as Error).message;
    return stats;
  }
}

async function main() {
  const reportPath = resolve(process.cwd(), 'scripts/duplicados-report.json');
  const reporte = JSON.parse(readFileSync(reportPath, 'utf-8')) as {
    grupos: Grupo[];
  };

  const todosGrupos = reporte.grupos.filter((g) => g.confianza >= MIN_CONFIANZA);
  const grupos = todosGrupos.slice(0, LIMIT);
  const modo = APPLY ? '⚠️  MODO APPLY (cambios persistentes)' : '👀 DRY-RUN (no cambia nada)';

  console.log(`${modo} · confianza ≥ ${MIN_CONFIANZA}${LIMIT !== Infinity ? ` · limit ${LIMIT}` : ''}\n`);
  console.log(`Grupos elegibles: ${grupos.length} de ${todosGrupos.length} totales`);
  console.log(`Duplicados a fusionar: ${grupos.reduce((s, g) => s + g.socios.length - 1, 0)}\n`);

  const pg = pgClient();
  await pg.connect();

  // Filtrar FK_REFS para incluir solo tablas+columnas que existen
  const { rows: existing } = await pg.query<{ table_name: string; column_name: string }>(`
    select table_name, column_name from information_schema.columns
    where table_schema = 'public'
  `);
  const colSet = new Set(existing.map((r) => `${r.table_name}.${r.column_name}`));
  const before = FK_REFS.length;
  for (let i = FK_REFS.length - 1; i >= 0; i--) {
    if (!colSet.has(`${FK_REFS[i]!.tabla}.${FK_REFS[i]!.columna}`)) {
      console.log(`   ⚠ ignorando ${FK_REFS[i]!.tabla}.${FK_REFS[i]!.columna} (no existe)`);
      FK_REFS.splice(i, 1);
    }
  }
  console.log(`   FK refs activas: ${FK_REFS.length}/${before}\n`);

  let total_ok = 0, total_err = 0;
  let total_campos = 0, total_fks = 0;
  const errores: MergeStats[] = [];

  for (const [i, g] of grupos.entries()) {
    const canonId = g.candidato_canonical_id;
    const dups = g.socios.filter((s) => s.id !== canonId);

    for (const dup of dups) {
      const stats = await mergePar(pg, dup.id, canonId);
      if (stats.ok) {
        total_ok++;
        total_campos += stats.campos_copiados.length;
        total_fks += Object.values(stats.fks_movidas).reduce((a, b) => a + b, 0);

        if (i < 5 || stats.campos_copiados.length > 0 || Object.keys(stats.fks_movidas).length > 0) {
          console.log(`[OK ${i + 1}/${grupos.length}] ${dup.nombre_completo}`);
          console.log(`     dup=${dup.id.slice(0,8)}… → canon=${canonId.slice(0,8)}…`);
          if (stats.campos_copiados.length) console.log(`     ↳ campos: ${stats.campos_copiados.join(', ')}`);
          for (const [k, n] of Object.entries(stats.fks_movidas)) {
            console.log(`     ↳ ${k}: ${n} fila(s) movida(s)`);
          }
          for (const s of stats.skipped_unique) console.log(`     ⚠ ${s}`);
        }
      } else {
        total_err++;
        errores.push(stats);
        console.log(`[ERR ${i + 1}/${grupos.length}] ${dup.nombre_completo}: ${stats.error}`);
      }
    }
  }

  await pg.end();

  console.log(`\n📊 Resumen:`);
  console.log(`   Merges OK:     ${total_ok}`);
  console.log(`   Merges ERROR:  ${total_err}`);
  console.log(`   Campos copiados al canonical: ${total_campos}`);
  console.log(`   Filas FK movidas:             ${total_fks}`);
  if (!APPLY) {
    console.log(`\n   👀 Dry-run: nada se guardó. Para aplicar:`);
    console.log(`      pnpm tsx scripts/merge-socios-duplicados.ts --apply\n`);
  } else {
    console.log(`\n   ✅ Cambios persistidos.`);
  }

  if (errores.length > 0) {
    const errPath = resolve(process.cwd(), 'scripts/merge-errores.json');
    writeFileSync(errPath, JSON.stringify(errores, null, 2), 'utf-8');
    console.log(`\n   📄 Errores en: ${errPath}`);
  }
}

main().catch((e) => {
  console.error('❌', e.message ?? e);
  process.exit(1);
});

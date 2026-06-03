/**
 * Marca al titular de cada concesión VIGENTE como CHOFER de su propia unidad
 * cuando su `socios.ocupacion = 'CHOFER'` (case-insensitive, trim).
 *
 * Idempotente: solo inserta si no existe ya un contrato ACTIVO del titular
 * en esa concesión (UNIQUE parcial `cc_unique_activo`).
 *
 * Maneja errores por fila (ej. exclusión `cc_no_overlap` por solape con
 * contrato cerrado): captura, registra y continúa sin abortar el lote.
 *
 * Uso:
 *   pnpm tsx scripts/marcar-titular-chofer-por-ocupacion.ts          # dry-run
 *   pnpm tsx scripts/marcar-titular-chofer-por-ocupacion.ts --apply
 *   pnpm tsx scripts/marcar-titular-chofer-por-ocupacion.ts --apply --limit 50
 */

import { pgClient } from './_utils';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const APPLY = process.argv.includes('--apply');
const limIdx = process.argv.indexOf('--limit');
const LIMIT = limIdx >= 0 ? Number(process.argv[limIdx + 1]) : Infinity;

interface Candidato {
  concesion_id: string;
  numero_concesion: string;
  taxi_numero: number | null;
  socio_id: string;
  nombre_completo: string;
  fecha_inicio: string;
}

async function main() {
  const pg = pgClient();
  await pg.connect();

  console.log(`${APPLY ? '⚠️  APPLY' : '👀 DRY-RUN'}${LIMIT !== Infinity ? ` · limit ${LIMIT}` : ''}\n`);

  const { rows: candidatos } = await pg.query<Candidato>(`
    select
      c.id as concesion_id,
      c.numero_concesion,
      c.taxi_numero,
      c.socio_id,
      s.nombre_completo,
      coalesce(c.fecha_concesion, current_date)::text as fecha_inicio
    from concesiones c
    join socios s on s.id = c.socio_id
    where c.estado = 'VIGENTE'
      and upper(trim(s.ocupacion)) = 'CHOFER'
      and not exists (
        select 1 from concesion_choferes cc
        where cc.concesion_id = c.id
          and cc.chofer_socio_id = c.socio_id
          and cc.fecha_fin is null
      )
    order by c.taxi_numero nulls last
  `);

  const items = candidatos.slice(0, LIMIT);
  console.log(`Candidatos elegibles: ${items.length} (de ${candidatos.length} totales)\n`);

  if (items.length === 0) {
    console.log('   ✅ Nada que hacer.');
    await pg.end();
    return;
  }

  console.log('Muestra (primeros 10):');
  for (const c of items.slice(0, 10)) {
    console.log(`   - ${c.numero_concesion} | Taxi #${c.taxi_numero ?? '—'} | ${c.nombre_completo}`);
  }
  console.log();

  let okCount = 0;
  let errCount = 0;
  const errores: Array<{ candidato: Candidato; error: string }> = [];

  await pg.query('begin');
  try {
    for (const c of items) {
      // Cada insert va en su propio savepoint para que un error no aborte el lote
      await pg.query('savepoint sp');
      try {
        await pg.query(
          `insert into concesion_choferes
             (concesion_id, chofer_socio_id, rol, fecha_inicio, observaciones)
           values ($1, $2, 'CHOFER', $3, $4)`,
          [
            c.concesion_id,
            c.socio_id,
            c.fecha_inicio,
            'Auto-generado por OCUPACION=CHOFER del padrón CSV 2026',
          ],
        );
        await pg.query('release savepoint sp');
        okCount++;
      } catch (e) {
        await pg.query('rollback to savepoint sp');
        const err = e as { message?: string; code?: string };
        errores.push({
          candidato: c,
          error: `[${err.code ?? '?'}] ${err.message ?? String(e)}`,
        });
        errCount++;
      }
    }

    if (APPLY) await pg.query('commit');
    else await pg.query('rollback');
  } catch (e) {
    await pg.query('rollback');
    throw e;
  }
  await pg.end();

  const outPath = resolve(process.cwd(), 'scripts/titular-chofer-report.json');
  writeFileSync(outPath, JSON.stringify({
    aplicados: okCount,
    errores: errCount,
    detalle_errores: errores,
  }, null, 2), 'utf-8');

  console.log('📊 Resumen:');
  console.log(`   Insertados OK:   ${okCount}`);
  console.log(`   Errores por fila: ${errCount}`);
  if (errCount > 0) {
    console.log('   Primeros 5 errores:');
    for (const e of errores.slice(0, 5)) {
      console.log(`     - ${e.candidato.numero_concesion} (${e.candidato.nombre_completo}): ${e.error}`);
    }
  }
  console.log(`\n📄 Reporte: ${outPath}`);
  console.log(APPLY ? '\n✅ Cambios persistidos.' : '\n👀 Dry-run — usa --apply.');
}

main().catch((e) => { console.error('❌', e); process.exit(1); });

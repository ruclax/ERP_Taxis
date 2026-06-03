/**
 * Repara mojibake Ñ → ¥ (y ¤) en todas las columnas text de tablas relacionadas con socios.
 *
 * Origen del bug: el script de importación leyó los CSVs como UTF-8 cuando
 * estaban en Windows-1252 (o viceversa). La Ñ (U+00D1, 0xD1) se transformó
 * a ¥ (U+00A5) o ¤ (U+00A4) según la mala interpretación.
 *
 * Estrategia: reemplazar ambos símbolos por Ñ. Es seguro porque:
 *   - ¥ y ¤ no aparecen legítimamente en nombres ni direcciones en español.
 *   - El padrón actual tiene 0 socios con Ñ correcta → no se rompe nada existente.
 *
 * Uso:
 *   pnpm tsx scripts/fix-encoding-enie.ts                  # dry-run
 *   pnpm tsx scripts/fix-encoding-enie.ts --apply
 */
import { pgClient } from './_utils';

const APPLY = process.argv.includes('--apply');

// (tabla, columna)
const TARGETS: Array<[string, string]> = [
  ['socios', 'nombre_completo'],
  ['socios', 'comentarios'],
  ['socios', 'lugar_nacimiento'],
  ['socios', 'escolaridad'],
  ['socios_direcciones', 'calle'],
  ['socios_direcciones', 'colonia'],
  ['socios_direcciones', 'municipio'],
  ['socios_direcciones', 'estado'],
  ['socios_direcciones', 'referencias'],
  ['socios_contactos', 'valor'],
  ['socios_beneficiarios', 'nombre'],
  ['socios_beneficiarios', 'parentesco'],
  ['concesiones', 'modalidad'],
  ['concesiones', 'submodalidad'],
  ['concesiones', 'ruta_denominada'],
  ['concesiones', 'cesion_sucesion'],
  ['sitios', 'nombre'],
  ['sitios', 'direccion'],
  ['vehiculos', 'comentarios'],
  ['polizas', 'comentarios'],
];

async function main() {
  const pg = pgClient();
  await pg.connect();

  // Filtrar columnas que existan
  const { rows: cols } = await pg.query<{ t: string; c: string }>(`
    select table_name as t, column_name as c
    from information_schema.columns
    where table_schema = 'public' and data_type in ('text','character varying')
  `);
  const existing = new Set(cols.map((r) => `${r.t}.${r.c}`));
  const targets = TARGETS.filter(([t, c]) => existing.has(`${t}.${c}`));

  console.log(`${APPLY ? '⚠️  APPLY' : '👀 DRY-RUN'} · reemplazando ¥ y ¤ por Ñ\n`);

  let total = 0;
  await pg.query('begin');
  try {
    for (const [tabla, col] of targets) {
      // Conteo antes
      const { rows: [{ n }] } = await pg.query<{ n: number }>(
        `select count(*)::int as n from "${tabla}" where "${col}" like '%¥%' or "${col}" like '%¤%'`,
      );
      if (n === 0) continue;

      // Muestra hasta 3 ejemplos (con la misma heurística)
      const { rows: ej } = await pg.query<{ v: string; nuevo: string }>(
        `select "${col}" as v,
                regexp_replace(
                  regexp_replace("${col}", '([a-záéíóúüñ])[¥¤]([a-záéíóúüñ])', '\\1ñ\\2', 'g'),
                  '[¥¤]', 'Ñ', 'g'
                ) as nuevo
         from "${tabla}" where "${col}" like '%¥%' or "${col}" like '%¤%' limit 3`,
      );

      console.log(`📝 ${tabla}.${col}: ${n} filas a reparar`);
      for (const e of ej) console.log(`     "${e.v}"  →  "${e.nuevo}"`);

      // Update con heurística contextual:
      //   Si el ¥/¤ está rodeado de minúsculas → ñ
      //   En cualquier otro caso → Ñ
      // Hacemos los 4 reemplazos posibles, en orden de especificidad:
      //   minúscula-(¥|¤)-minúscula → ñ
      //   resto                     → Ñ
      await pg.query(
        `update "${tabla}" set "${col}" =
           regexp_replace(
             regexp_replace("${col}", '([a-záéíóúüñ])[¥¤]([a-záéíóúüñ])', '\\1ñ\\2', 'g'),
             '[¥¤]', 'Ñ', 'g'
           )
         where "${col}" like '%¥%' or "${col}" like '%¤%'`,
      );
      total += n;
    }

    if (APPLY) await pg.query('commit');
    else await pg.query('rollback');
  } catch (e) {
    await pg.query('rollback');
    throw e;
  }

  console.log(`\n📊 Total filas reparadas: ${total}`);
  console.log(APPLY ? '✅ Cambios persistidos.' : '👀 Dry-run: nada se guardó. Usa --apply.');

  await pg.end();
}

main().catch((e) => { console.error('❌', e); process.exit(1); });

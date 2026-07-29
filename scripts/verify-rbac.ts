/**
 * pnpm verify:rbac
 * Guard de consistencia RBAC (M6): cruza la matriz estática de menús
 * `packages/auth/src/rbac.ts` (ROLES) contra la tabla `roles` de la BD
 * (que la app admin edita). Si divergen, el menú de la web y lo que el
 * admin cree que configuró dejan de coincidir → falla.
 *
 * Normalización: el módulo `expediente` de la BD es un sub-permiso de
 * `padron` (los expedientes viven bajo /padron), así que se mapea a
 * `padron` antes de comparar.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import { ROLES } from '../packages/auth/src/rbac';

const C = { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' };

const env: Record<string, string> = {};
for (const l of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

/** `expediente` (BD) ≡ acceso a `padron` (nav). */
function normaliza(mods: string[]): Set<string> {
  return new Set(mods.map((m) => (m === 'expediente' ? 'padron' : m)));
}

async function main() {
  const client = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const { rows } = await client.query<{ codigo: string; modulos_acceso: string[]; scope_tipo: string; solo_lectura: boolean }>(
    `select codigo, modulos_acceso, scope_tipo, solo_lectura from roles`
  );
  await client.end();

  console.log(`\n${C.b}━━ Consistencia RBAC (rbac.ts ↔ tabla roles) ━━${C.x}`);
  let drift = 0;
  const enBd = new Set(rows.map((r) => r.codigo));

  for (const r of rows) {
    const def = (ROLES as Record<string, { modulos: string[]; scope: string; soloLectura?: string[] }>)[r.codigo];
    if (!def) {
      console.log(`  ${C.r}✗${C.x} rol '${r.codigo}' existe en BD pero NO en rbac.ts`);
      drift++;
      continue;
    }
    const db = normaliza(r.modulos_acceso ?? []);
    const ts = normaliza(def.modulos);
    const soloDb = [...db].filter((m) => !ts.has(m));
    const soloTs = [...ts].filter((m) => !db.has(m));
    const problemas: string[] = [];
    if (soloDb.length) problemas.push(`sólo-BD=[${soloDb.join(',')}]`);
    if (soloTs.length) problemas.push(`sólo-rbac.ts=[${soloTs.join(',')}]`);
    if (def.scope !== r.scope_tipo) problemas.push(`scope rbac=${def.scope} vs bd=${r.scope_tipo}`);

    if (problemas.length) {
      console.log(`  ${C.r}✗${C.x} ${r.codigo.padEnd(18)} ${problemas.join(' · ')}`);
      drift++;
    } else {
      console.log(`  ${C.g}✓${C.x} ${r.codigo}`);
    }
  }

  for (const codigo of Object.keys(ROLES)) {
    if (!enBd.has(codigo)) {
      console.log(`  ${C.r}✗${C.x} rol '${codigo}' existe en rbac.ts pero NO en BD`);
      drift++;
    }
  }

  if (drift === 0) {
    console.log(`\n${C.g}✅ RBAC consistente entre la web (rbac.ts) y la BD (tabla roles).${C.x}\n`);
  } else {
    console.log(`\n${C.r}❌ ${drift} discrepancia(s). La web y el admin divergen — sincroniza rbac.ts con la tabla roles.${C.x}\n`);
  }
  process.exit(drift > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`Error: ${(e as Error).message}`);
  process.exit(1);
});

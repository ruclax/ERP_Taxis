/**
 * Aplica uno o más archivos SQL a Supabase.
 * Uso: tsx scripts/apply-sql-file.ts file1.sql file2.sql ...
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { log, pgClient } from './_utils.js';

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    log.err('Uso: tsx scripts/apply-sql-file.ts file1.sql [file2.sql ...]');
    process.exit(1);
  }

  const client = pgClient();
  await client.connect();
  try {
    for (const f of files) {
      const path = resolve(process.cwd(), f);
      const sql = readFileSync(path, 'utf8');
      log.info(`Aplicando ${f} (${sql.length} bytes)...`);
      const start = Date.now();
      const res = await client.query(sql);
      const ms = Date.now() - start;
      const rc = Array.isArray(res) ? res.reduce((s, r) => s + (r.rowCount ?? 0), 0) : (res.rowCount ?? 0);
      log.ok(`  ${rc} filas afectadas en ${(ms / 1000).toFixed(1)}s`);
    }
  } catch (e: any) {
    log.err(`Falló: ${e.message}`);
    if (e.detail) log.dim(`  detail: ${e.detail}`);
    if (e.position) log.dim(`  position: ${e.position}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

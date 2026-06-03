/**
 * pnpm db:migrate           → aplica migraciones pendientes
 * pnpm db:reset             → DROP schema public + re-aplica todas (¡destructivo!)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { log, pgClient } from './_utils.js';

const MIGRATIONS_DIR = resolve(process.cwd(), 'supabase', 'migrations');
const reset = process.argv.includes('--reset');

async function main() {
  log.bold(`\n🗄️  ${reset ? 'Reset + migración completa' : 'Aplicando migraciones pendientes'}...\n`);

  const client = pgClient();
  await client.connect();

  try {
    if (reset) {
      log.warn('Modo --reset: borrando schema public y re-creando...');
      await client.query(`drop schema if exists public cascade`);
      await client.query(`drop schema if exists private cascade`);
      await client.query(`create schema public`);
      await client.query(`grant usage on schema public to anon, authenticated, service_role`);
      await client.query(`grant all on schema public to postgres, service_role`);
      log.ok('Schema reseteado');
    }

    // Tabla de control de migraciones aplicadas
    await client.query(`
      create table if not exists public._meta_migrations (
        name        text primary key,
        applied_at  timestamptz not null default now(),
        checksum    text
      )
    `);

    const applied = new Set<string>(
      (await client.query(`select name from public._meta_migrations order by name`)).rows.map(
        (r) => r.name as string
      )
    );

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      log.warn('No hay archivos de migración en supabase/migrations/');
      return;
    }

    let aplicadas = 0;
    let saltadas = 0;

    for (const file of files) {
      if (applied.has(file)) {
        log.dim(`   ⏭️   ${file} (ya aplicada)`);
        saltadas++;
        continue;
      }

      const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
      process.stdout.write(`   🚀  Aplicando ${file}... `);
      try {
        await client.query('begin');
        await client.query(sql);
        await client.query(
          `insert into public._meta_migrations (name) values ($1) on conflict do nothing`,
          [file]
        );
        await client.query('commit');
        process.stdout.write('OK\n');
        aplicadas++;
      } catch (e: any) {
        await client.query('rollback');
        process.stdout.write('FALLÓ\n');
        log.err(`     ${e.message}`);
        if (e.detail) log.dim(`     detail: ${e.detail}`);
        if (e.hint) log.dim(`     hint: ${e.hint}`);
        if (e.position) log.dim(`     position: ${e.position}`);
        process.exit(1);
      }
    }

    log.bold(`\n📊 Resumen: ${aplicadas} aplicada(s), ${saltadas} ya en estado.\n`);

    if (aplicadas > 0) {
      const tablas = await client.query(`
        select count(*)::int as n from information_schema.tables
        where table_schema='public' and table_type='BASE TABLE'
      `);
      log.ok(`Schema final: ${tablas.rows[0].n} tablas en public.`);
      log.dim('\nSiguiente paso: pnpm db:seed para importar los CSVs.\n');
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  log.err(`Error inesperado: ${e.message}`);
  process.exit(1);
});

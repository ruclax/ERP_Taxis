/**
 * pnpm db:check
 * Smoke test antes de aplicar migraciones.
 * Verifica acceso a Postgres y al endpoint REST de Supabase.
 */
import { createClient } from '@supabase/supabase-js';
import { env, log, pgClient, requireEnv } from './_utils.js';

async function main() {
  log.bold('\n🔌 Verificando conexión a Supabase...\n');

  // 1) Variables presentes
  requireEnv('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL');
  log.ok(`Variables de entorno OK`);
  log.dim(`   URL: ${env.SUPABASE_URL}`);

  // 2) Test PostgreSQL directo
  const client = pgClient();
  try {
    await client.connect();
    const v = await client.query('select version() as version, current_database() as db');
    const region = env.DATABASE_URL.match(/@([\w.-]+)\./)?.[1] ?? 'unknown';
    log.ok(`Postgres alcanzable`);
    log.dim(`   ${v.rows[0].version}`);
    log.dim(`   Database: ${v.rows[0].db}`);
    log.dim(`   Host region: ${region}`);
  } catch (e: any) {
    log.err(`Falló conexión Postgres: ${e.message}`);
    if (e.message.includes('password authentication failed')) {
      log.warn(`  Contraseña incorrecta. Resetea en Dashboard → Database → Reset password.`);
    } else if (e.message.includes('ENOTFOUND')) {
      log.warn(`  Host no encontrado — revisa el project ref en DATABASE_URL.`);
    }
    process.exit(2);
  } finally {
    await client.end();
  }

  // 3) Test REST API (anon)
  try {
    const sb = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const { error } = await sb.auth.getSession();
    if (error) throw error;
    log.ok(`Supabase REST API responde (anon)`);
  } catch (e: any) {
    log.err(`Falló REST API: ${e.message}`);
    process.exit(3);
  }

  // 4) Test admin (service_role)
  try {
    const sbAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await sbAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    log.ok(`Service role key válida (${data.users.length} usuarios consultados)`);
  } catch (e: any) {
    log.err(`Falló service_role: ${e.message}`);
    log.warn(`  Revisa que SUPABASE_SERVICE_ROLE_KEY sea la llave "secret", no la "anon".`);
    process.exit(4);
  }

  log.bold(`\n🎉 Todo correcto — puedes continuar con: pnpm db:migrate\n`);
}

main().catch((e) => {
  log.err(`Error inesperado: ${e.message}`);
  process.exit(1);
});

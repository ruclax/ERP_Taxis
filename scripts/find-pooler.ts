/**
 * Diagnóstico: encuentra a qué pooler está asignado el proyecto.
 * Intenta conectarse con cada región del pooler y reporta cuál acepta el tenant.
 *
 * Uso: tsx scripts/find-pooler.ts
 */
import { Client } from 'pg';
import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const f of ['.env.local', '.env']) {
  const p = resolve(process.cwd(), f);
  if (existsSync(p)) dotenvConfig({ path: p, override: false });
}

const urlOrig = process.env.DATABASE_URL ?? '';
if (!urlOrig) {
  console.error('DATABASE_URL no definida en .env.local');
  process.exit(1);
}

// Extrae componentes del URL original
const m = urlOrig.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)/);
if (!m) {
  console.error('DATABASE_URL no tiene el formato esperado.');
  process.exit(1);
}
const [, user, password, hostOriginal, port, db] = m;

const projectRef = user.includes('.') ? user.split('.')[1] : '';
console.log(`Project ref detectado: ${projectRef}`);
console.log(`Host original: ${hostOriginal}\n`);

const regiones = [
  'us-west-1',
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'ca-central-1',
  'sa-east-1',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'eu-north-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
];

async function probar(host: string): Promise<{ ok: boolean; msg: string }> {
  const client = new Client({
    host,
    port: Number(port),
    user,
    password,
    database: db,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    await client.query('select 1');
    return { ok: true, msg: 'OK' };
  } catch (e: any) {
    return { ok: false, msg: e.message };
  } finally {
    try { await client.end(); } catch {}
  }
}

async function main() {
  // 1) Probar la conexión DIRECTA (sin pooler)
  console.log('--- Conexión directa (db.<ref>.supabase.co:5432) ---');
  const directClient = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    user: 'postgres',           // direct usa 'postgres' a secas
    password,
    database: db,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    await directClient.connect();
    await directClient.query('select 1');
    console.log('   ✅ CONEXIÓN DIRECTA OK — la contraseña es correcta y el proyecto está activo.\n');
  } catch (e: any) {
    console.log(`   ❌ Falló: ${e.message}\n`);
    if (e.message.includes('password authentication')) {
      console.log('   ⚠️  La contraseña en DATABASE_URL es incorrecta. Reséteala en el dashboard.');
      process.exit(2);
    }
  } finally {
    try { await directClient.end(); } catch {}
  }

  // 2) Probar todos los poolers
  console.log('--- Probando poolers por región ---');
  for (const r of regiones) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    process.stdout.write(`  ${host} ... `);
    const res = await probar(host);
    console.log(res.ok ? `✅ OK — usa este!` : `❌ ${res.msg}`);
    if (res.ok) {
      console.log(`\n👉 Actualiza DATABASE_URL en .env.local con host: ${host}\n`);
      const fixed = urlOrig.replace(hostOriginal, host);
      console.log(`   DATABASE_URL=${fixed.replace(password, '[YOUR-PASSWORD]')}`);
      return;
    }
  }

  console.log('\n⚠️  Ningún pooler aceptó el tenant. Usa la conexión directa por ahora:');
  console.log(`   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`);
}

main();

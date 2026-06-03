import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const l of envFile.split(/\r?\n/)) {
  const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}
const c = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

console.log('=== sugerir_socios("JOR") ===');
const s = await c.query("select * from sugerir_socios('JOR')");
console.table(s.rows);

console.log('\n=== sugerir_socios("27P-03") ===');
const s2 = await c.query("select * from sugerir_socios('27P-03')");
console.table(s2.rows);

console.log('\n=== sugerir_vehiculos("A44") ===');
const v = await c.query("select * from sugerir_vehiculos('A44')");
console.table(v.rows);

console.log('\n=== sugerir_vehiculos("NISS") ===');
const v2 = await c.query("select * from sugerir_vehiculos('NISS')");
console.table(v2.rows);

await c.end();

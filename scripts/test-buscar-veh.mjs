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

const tests = [
  { q: 'A445VUV',  desc: 'Placas exactas' },
  { q: 'NISSAN',   desc: 'Marca' },
  { q: 'TSURU',    desc: 'Modelo' },
  { q: '2018',     desc: 'Año' },
  { q: '27P-0325', desc: 'Concesión' },
  { q: 'LOPEZ',    desc: 'Por nombre titular' },
  { q: '1',        desc: 'Núm taxi o año (1 dígito)' },
];

console.log('Test buscar_vehiculos():');
for (const t of tests) {
  const r = await c.query('select count(*)::int as n from buscar_vehiculos($1)', [t.q]);
  console.log(`  "${t.q.padEnd(15)}" (${t.desc.padEnd(25)}) → ${r.rows[0].n} matches`);
}

await c.end();

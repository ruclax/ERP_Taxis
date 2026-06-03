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
  { q: 'LOPEZ',     desc: 'Por nombre' },
  { q: '27P-0325',  desc: 'Por concesión' },
  { q: 'A445VUV',   desc: 'Por placas' },
  { q: 'a445vuv',   desc: 'Por placas (lowercase)' },
  { q: '1',         desc: 'Por número (escalafón o taxi)' },
  { q: 'RODR570202UAA', desc: 'Por RFC exacto' },
];

console.log('Test buscar_socios():');
for (const t of tests) {
  const r = await c.query('select count(*)::int as n from buscar_socios($1)', [t.q]);
  console.log(`  "${t.q.padEnd(20)}" (${t.desc.padEnd(30)}) → ${r.rows[0].n} matches`);
}

// Sample results para "LOPEZ"
const r = await c.query(`
  select s.nombre_completo, s.rfc, s.escalafon_numero
  from buscar_socios('LOPEZ') ids
  join socios s on s.id = ids
  limit 5
`);
console.log('\nMuestra de "LOPEZ":');
console.table(r.rows);

await c.end();

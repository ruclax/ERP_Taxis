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

console.log('═══ Muestra de 3 socios ═══');
const sample = await c.query(`select rfc, curp, nombre_completo, escalafon_numero,
  soc_act, soc_veint, soc_tran, turno, firma_actual, tipo_socio
  from socios where rfc is not null limit 3`);
console.table(sample.rows);

console.log('\n═══ Conteos categóricos ═══');
const r1 = await c.query(`select
  count(*) filter (where escalafon_numero is not null) as con_escalafon,
  count(*) filter (where soc_act) as soc_act,
  count(*) filter (where soc_veint) as soc_veint,
  count(*) filter (where soc_tran) as soc_tran,
  count(*) filter (where turno is not null) as con_turno,
  count(*) filter (where firma_actual = 'RECABADA') as firma_recabada,
  count(*) as total
from socios`);
console.table(r1.rows);

console.log('\n═══ Concesiones por socio (top con más de 1) ═══');
const r2 = await c.query(`select s.nombre_completo, count(c.id) as concesiones
  from socios s join concesiones c on c.socio_id = s.id
  group by s.id, s.nombre_completo having count(c.id) > 1
  order by count(c.id) desc limit 5`);
console.table(r2.rows);

console.log('\n═══ Sitios con más unidades ═══');
const r3 = await c.query(`select s.nombre, count(c.id) as unidades
  from sitios s join concesiones c on c.sitio_id = s.id
  group by s.nombre order by count(c.id) desc limit 8`);
console.table(r3.rows);

await c.end();

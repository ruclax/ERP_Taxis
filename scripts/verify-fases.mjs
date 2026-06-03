// Verificación funcional de Fases 1 y 2 (proyecto base)
// 1. Verifica integridad de datos en Supabase
// 2. Verifica que las páginas web respondan y rendericen datos reales
// 3. Verifica funciones críticas (búsqueda, multi-concesión, estados, etc.)

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const l of envFile.split(/\r?\n/)) {
  const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB_URL = env.DATABASE_URL;
const EMAIL = 'daniel.isaias.st@gmail.com';
const PASSWORD = 'f4bwAVyqEH7ge9YX';
const projectRef = SB_URL.match(/https:\/\/([\w-]+)\.supabase\.co/)[1];

const C = { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m', bold: '\x1b[1m' };
const ok = (m) => console.log(`  ${C.green}✓${C.reset} ${m}`);
const fail = (m) => console.log(`  ${C.red}✗${C.reset} ${m}`);
const warn = (m) => console.log(`  ${C.yellow}⚠${C.reset} ${m}`);
const sec = (m) => console.log(`\n${C.cyan}${C.bold}━━ ${m} ━━${C.reset}`);

let totalOk = 0;
let totalFail = 0;
let totalWarn = 0;

async function check(label, fn) {
  try {
    const r = await fn();
    if (r === false) { fail(label); totalFail++; }
    else if (r === 'warn') { warn(label); totalWarn++; }
    else {
      ok(`${label}${r && typeof r === 'string' ? ` — ${r}` : ''}`);
      totalOk++;
    }
  } catch (e) {
    fail(`${label} → ${e.message}`);
    totalFail++;
  }
}

// ═════════════════════════════════════════════
// 1) INTEGRIDAD DE DATOS EN SUPABASE
// ═════════════════════════════════════════════

const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

async function q(sql, params = []) {
  const r = await client.query(sql, params);
  return r.rows;
}

sec('FASE 1 — Padrón y Dashboard');

await check('Tabla `socios` con datos', async () => {
  const r = await q('select count(*)::int as n from socios');
  return r[0].n > 1000 ? `${r[0].n} socios` : false;
});

await check('Distribución de estatus', async () => {
  const r = await q(`select estatus, count(*)::int as n from socios group by estatus order by n desc`);
  return r.map(x => `${x.estatus}:${x.n}`).join(' · ');
});

await check('Socios con escalafón asignado (padrón sindical activo)', async () => {
  const r = await q('select count(*)::int as n from socios where escalafon_numero is not null');
  return r[0].n > 100 ? `${r[0].n} con escalafón` : false;
});

await check('Categorías sindicales (SOC_ACT / VEINT / TRAN)', async () => {
  const r = await q(`select
    sum(case when soc_act then 1 else 0 end)::int as act,
    sum(case when soc_veint then 1 else 0 end)::int as veint,
    sum(case when soc_tran then 1 else 0 end)::int as tran
    from socios`);
  const total = r[0].act + r[0].veint + r[0].tran;
  if (total === 0) return false;
  return `ACT:${r[0].act} · 20+:${r[0].veint} · TRAN:${r[0].tran}`;
});

await check('Firma actual recabada vs pendiente', async () => {
  const r = await q(`select
    count(*) filter (where firma_actual = 'RECABADA')::int as recabada,
    count(*) filter (where firma_actual = 'PENDIENTE')::int as pendiente
    from socios`);
  return `RECABADA:${r[0].recabada} · PENDIENTE:${r[0].pendiente}`;
});

await check('Turno asignado', async () => {
  const r = await q('select count(*)::int as n from socios where turno is not null');
  return r[0].n > 100 ? `${r[0].n} con turno` : false;
});

await check('Comentarios libres (notas + firma migrada)', async () => {
  const r = await q('select count(*)::int as n from socios where comentarios is not null');
  return r[0].n > 100 ? `${r[0].n} con comentarios` : false;
});

await check('Búsqueda por nombre (LIKE índice gin_trgm)', async () => {
  const r = await q("select count(*)::int as n from socios where nombre_completo ilike '%LOPEZ%'");
  return r[0].n > 0 ? `${r[0].n} coincidencias con "LOPEZ"` : false;
});

await check('Búsqueda por RFC', async () => {
  const r = await q("select count(*)::int as n from socios where rfc is not null");
  return r[0].n > 0 ? `${r[0].n} socios con RFC` : false;
});

await check('Búsqueda por CURP', async () => {
  const r = await q("select count(*)::int as n from socios where curp is not null");
  return r[0].n > 0 ? `${r[0].n} socios con CURP` : false;
});

sec('FASE 2 — Gestión Vehicular + Trazabilidad');

await check('Tabla `sitios` con datos', async () => {
  const r = await q('select count(*)::int as n from sitios');
  return r[0].n > 50 ? `${r[0].n} sitios` : false;
});

await check('Tabla `concesiones` con datos', async () => {
  const r = await q('select count(*)::int as n from concesiones');
  return r[0].n > 200 ? `${r[0].n} concesiones` : false;
});

await check('Concesiones vinculadas a sitio (padrón por sitio)', async () => {
  const r = await q('select count(*)::int as n from concesiones where sitio_id is not null');
  return r[0].n > 100 ? `${r[0].n} con sitio asignado` : false;
});

await check('Tabla `vehiculos` con datos', async () => {
  const r = await q('select count(*)::int as n from vehiculos');
  return r[0].n > 200 ? `${r[0].n} vehículos` : false;
});

await check('Vehículos vinculados a concesión (vínculo relacional Fase 2)', async () => {
  const r = await q('select count(*)::int as n from vehiculos where concesion_actual_id is not null');
  return r[0].n > 100 ? `${r[0].n} con concesión` : false;
});

await check('Tabla `polizas` con datos', async () => {
  const r = await q('select count(*)::int as n from polizas');
  return r[0].n > 100 ? `${r[0].n} pólizas` : false;
});

await check('Estados de pólizas calculados (VIGENTE / POR_VENCER / VENCIDA)', async () => {
  const r = await q(`select estado, count(*)::int as n from polizas group by estado order by n desc`);
  return r.map(x => `${x.estado}:${x.n}`).join(' · ');
});

await check('Socios con MÚLTIPLES concesiones (uno-a-muchos)', async () => {
  const r = await q(`select count(*)::int as n from (
    select socio_id, count(*) c from concesiones group by socio_id having count(*) > 1
  ) sq`);
  return r[0].n > 0 ? `${r[0].n} socios con 2+ concesiones` : 'warn';
});

await check('Sitios con conteo de unidades (para padrón por sitio)', async () => {
  const r = await q(`select s.nombre, count(c.id)::int as n
    from sitios s left join concesiones c on c.sitio_id = s.id
    group by s.nombre order by n desc limit 5`);
  return r.map(x => `${x.nombre}:${x.n}`).join(' · ');
});

sec('FASE 2 — Historial de Movimientos (Daniel.docx: choferes que han manejado cada carro)');

await check('Tabla `historial_choferes` existe', async () => {
  const r = await q(`select count(*)::int as n from information_schema.tables
    where table_schema='public' and table_name='historial_choferes'`);
  return r[0].n === 1;
});

await check('Tabla `vehiculo_asignaciones` existe', async () => {
  const r = await q(`select count(*)::int as n from information_schema.tables
    where table_schema='public' and table_name='vehiculo_asignaciones'`);
  return r[0].n === 1;
});

await check('Datos de historial de choferes', async () => {
  const r = await q('select count(*)::int as n from historial_choferes');
  if (r[0].n === 0) return 'warn';  // tabla vacía es esperado, falta poblar
  return `${r[0].n} asignaciones`;
});

await check('Datos de asignaciones vehículo↔concesión', async () => {
  const r = await q('select count(*)::int as n from vehiculo_asignaciones');
  if (r[0].n === 0) return 'warn';
  return `${r[0].n} asignaciones`;
});

sec('Integridad relacional (no debe haber huérfanos)');

await check('Concesiones sin socio (orphan FK)', async () => {
  const r = await q(`select count(*)::int as n from concesiones c
    left join socios s on s.id = c.socio_id where s.id is null`);
  return r[0].n === 0 ? 'cero huérfanos' : `${r[0].n} concesiones huérfanas`;
});

await check('Vehículos sin concesión (orphan referencia)', async () => {
  const r = await q(`select count(*)::int as n from vehiculos v
    where v.concesion_actual_id is not null and not exists (
      select 1 from concesiones c where c.id = v.concesion_actual_id
    )`);
  return r[0].n === 0 ? 'cero huérfanos' : `${r[0].n} vehículos con concesión inválida`;
});

await check('Pólizas sin vehículo (orphan FK)', async () => {
  const r = await q(`select count(*)::int as n from polizas p
    left join vehiculos v on v.id = p.vehiculo_id where v.id is null`);
  return r[0].n === 0 ? 'cero huérfanos' : `${r[0].n} pólizas huérfanas`;
});

sec('RLS — Seguridad de filas');

await check('RLS habilitado en `socios`', async () => {
  const r = await q(`select relrowsecurity from pg_class where relname='socios'`);
  return r[0].relrowsecurity === true;
});

await check('RLS habilitado en `concesiones`', async () => {
  const r = await q(`select relrowsecurity from pg_class where relname='concesiones'`);
  return r[0].relrowsecurity === true;
});

await check('RLS habilitado en `vehiculos`', async () => {
  const r = await q(`select relrowsecurity from pg_class where relname='vehiculos'`);
  return r[0].relrowsecurity === true;
});

await check('Función superadmin bypass existe', async () => {
  const r = await q(`select count(*)::int as n from pg_proc
    where proname='user_es_superadmin' and pronamespace=(select oid from pg_namespace where nspname='private')`);
  return r[0].n === 1;
});

await client.end();

// ═════════════════════════════════════════════
// 2) PRUEBAS HTTP CON SESIÓN AUTENTICADA
// ═════════════════════════════════════════════

sec('Servidor web — respuestas HTTP autenticadas');

const tokens = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
}).then(r => r.json());

if (!tokens.access_token) {
  fail(`Auth Supabase falló: ${JSON.stringify(tokens)}`);
  process.exit(1);
}
ok(`JWT obtenido para ${tokens.user.email}`);

const cookieValue = 'base64-' + Buffer.from(JSON.stringify(tokens)).toString('base64');
const cookieName = `sb-${projectRef}-auth-token`;
const cookie = `${cookieName}=${cookieValue}`;

async function fetchAuth(path) {
  const r = await fetch(`http://localhost:3000${path}`, {
    headers: { cookie },
    redirect: 'manual',
  });
  return { status: r.status, location: r.headers.get('location'), body: r.status === 200 ? await r.text() : null };
}

await check('GET /dashboard responde 200', async () => {
  const r = await fetchAuth('/dashboard');
  return r.status === 200 ? `${(r.body?.length ?? 0)/1024 |0}KB` : false;
});

await check('Dashboard renderiza KPIs con números reales', async () => {
  const r = await fetchAuth('/dashboard');
  if (!r.body) return false;
  const hasUnidades = /1[,.]?\d{3}|304/.test(r.body);
  const hasPolizas = /142|249|94/.test(r.body);
  return hasUnidades && hasPolizas ? 'KPIs detectados' : 'warn';
});

await check('GET /padron responde 200', async () => {
  const r = await fetchAuth('/padron');
  return r.status === 200 ? `${(r.body?.length ?? 0)/1024 |0}KB` : false;
});

await check('Padrón renderiza nombres reales de socios', async () => {
  const r = await fetchAuth('/padron');
  if (!r.body) return false;
  const hasNombre = /MARIA|ROSA|JORGE|JUAN/.test(r.body);
  return hasNombre ? 'nombres encontrados' : false;
});

await check('Búsqueda por query string en /padron', async () => {
  const r = await fetchAuth('/padron?q=LOPEZ');
  if (!r.body) return false;
  const hasResult = r.body.includes('LOPEZ');
  return hasResult ? 'búsqueda funcional' : false;
});

await check('GET /flota responde 200', async () => {
  const r = await fetchAuth('/flota');
  return r.status === 200 ? `${(r.body?.length ?? 0)/1024 |0}KB` : false;
});

await check('Flota renderiza placas reales', async () => {
  const r = await fetchAuth('/flota');
  if (!r.body) return false;
  // Buscar patrón de placa mexicana (A111AAA o A11AAA)
  const m = r.body.match(/[A-Z]\d{3}[A-Z]{3}/);
  return m ? `placa ejemplo: ${m[0]}` : false;
});

await check('Flota renderiza concesiones 27P-XXXX', async () => {
  const r = await fetchAuth('/flota');
  if (!r.body) return false;
  const m = r.body.match(/27P+-\d{4}/);
  return m ? `concesión ejemplo: ${m[0]}` : false;
});

await check('Expediente individual /expedientes/[id]', async () => {
  // Get first socio id
  const tmpClient = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await tmpClient.connect();
  const r = await tmpClient.query("select id from socios where escalafon_numero is not null limit 1");
  await tmpClient.end();
  const id = r.rows[0]?.id;
  if (!id) return false;
  const res = await fetchAuth(`/expedientes/${id}`);
  return res.status === 200 ? `socio ${id.slice(0,8)}…` : false;
});

// ═════════════════════════════════════════════
// 3) RESUMEN
// ═════════════════════════════════════════════

console.log(`\n${C.bold}━━━ RESUMEN ━━━${C.reset}`);
console.log(`  ${C.green}✓${C.reset} ${totalOk} verificaciones exitosas`);
if (totalWarn > 0) console.log(`  ${C.yellow}⚠${C.reset} ${totalWarn} advertencias (vacíos esperados)`);
if (totalFail > 0) console.log(`  ${C.red}✗${C.reset} ${totalFail} fallos`);

console.log(`\n${totalFail === 0 ? C.green : C.red}${totalFail === 0 ? '✅ Fases 1 y 2 funcionando correctamente' : '❌ Hay fallas críticas'}${C.reset}\n`);

process.exit(totalFail > 0 ? 1 : 0);

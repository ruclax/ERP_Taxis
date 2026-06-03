// Simulación de login + recorrido de páginas en apps/web y apps/admin.
// Usa fetch + cookie jar manual para emular un navegador.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Cargar .env.local
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envFile.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = 'daniel.isaias.st@gmail.com';
const PASSWORD = 'f4bwAVyqEH7ge9YX';

const projectRef = SUPABASE_URL.match(/https:\/\/([\w-]+)\.supabase\.co/)[1];

// Cookie jar simple
class CookieJar {
  constructor() { this.cookies = {}; }
  parseSetCookie(headers) {
    const set = headers.getSetCookie?.() ?? [];
    for (const c of set) {
      const [pair] = c.split(';');
      const [name, ...rest] = pair.split('=');
      this.cookies[name.trim()] = rest.join('=').trim();
    }
  }
  header() {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  }
  list() {
    return Object.keys(this.cookies);
  }
}

const COLORS = { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m' };
const ok = (m) => console.log(`${COLORS.green}✓${COLORS.reset} ${m}`);
const fail = (m) => console.log(`${COLORS.red}✗${COLORS.reset} ${m}`);
const warn = (m) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${m}`);
const info = (m) => console.log(`${COLORS.cyan}ℹ${COLORS.reset} ${m}`);
const dim = (m) => console.log(`${COLORS.dim}  ${m}${COLORS.reset}`);

async function paso(label, fn) {
  process.stdout.write(`  ${label}... `);
  try {
    const r = await fn();
    process.stdout.write(`${COLORS.green}OK${COLORS.reset}\n`);
    return r;
  } catch (e) {
    process.stdout.write(`${COLORS.red}FAIL${COLORS.reset}\n`);
    console.log(`    ${COLORS.red}${e.message}${COLORS.reset}`);
    throw e;
  }
}

// Helper: visitar URL con jar
async function visitar(jar, url, expected = [200, 307, 308]) {
  const r = await fetch(url, {
    headers: { cookie: jar.header() },
    redirect: 'manual',
  });
  jar.parseSetCookie(r.headers);
  return {
    status: r.status,
    location: r.headers.get('location'),
    okStatus: expected.includes(r.status),
    body: r.status >= 200 && r.status < 300 ? await r.text() : null,
  };
}

// 1) Obtener tokens del proveedor Supabase
async function obtenerTokens() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!r.ok) throw new Error(`Auth API: ${r.status} ${await r.text()}`);
  return r.json();
}

// 2) Construir cookie del formato que usa @supabase/ssr
function setSupabaseCookie(jar, tokens) {
  const sessionData = [
    tokens.access_token,
    tokens.refresh_token,
    null,
    null,
    null,
  ];
  // @supabase/ssr v0.5 espera un JSON serializado con prefijo base64-
  const json = JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    expires_at: tokens.expires_at,
    token_type: tokens.token_type,
    user: tokens.user,
  });
  const value = 'base64-' + Buffer.from(json).toString('base64');
  // El nombre que usa @supabase/ssr es sb-{ref}-auth-token y se chunkea si es muy grande
  const cookieName = `sb-${projectRef}-auth-token`;
  // Si es muy grande hay que partir, pero por simplicidad ponemos como cookie único (Next acepta hasta 4KB)
  // Si excede, lo partimos en .0 .1 etc.
  if (value.length < 3500) {
    jar.cookies[cookieName] = value;
  } else {
    // chunked
    const chunks = [];
    for (let i = 0; i < value.length; i += 3500) chunks.push(value.slice(i, i + 3500));
    chunks.forEach((c, i) => { jar.cookies[`${cookieName}.${i}`] = c; });
  }
}

// Detección de errores reales (no chunks de Next)
function detectarErrorReal(body) {
  if (!body) return null;

  // Patrones de error real de Next.js / runtime
  const patrones = [
    { rx: /Application error: a server-side exception/i, label: 'Server-side exception' },
    { rx: /Unhandled Runtime Error/i, label: 'Runtime error' },
    { rx: /Cannot read prop/i, label: 'Cannot read property' },
    { rx: /Module not found.{0,200}/i, label: 'Module not found' },
    { rx: /TypeError: [^"\\]{0,200}/i, label: 'TypeError' },
    { rx: /<title>.*?500.*?<\/title>/i, label: 'Página 500' },
    { rx: /Your project's URL and Key are required/i, label: 'Supabase env vars missing' },
  ];

  for (const p of patrones) {
    const m = body.match(p.rx);
    if (m) return { tipo: p.label, fragmento: m[0].slice(0, 150) };
  }
  return null;
}

async function test(host, label, rutas) {
  console.log(`\n${COLORS.cyan}━━━ ${label} (${host}) ━━━${COLORS.reset}`);

  const jar = new CookieJar();
  const tokens = await paso('Obteniendo JWT de Supabase', obtenerTokens);
  dim(`user_id: ${tokens.user.id}`);

  setSupabaseCookie(jar, tokens);

  let errores = 0;
  for (const ruta of rutas) {
    const url = `${host}${ruta}`;
    const r = await visitar(jar, url, [200, 307, 308, 404]);
    const err = detectarErrorReal(r.body);
    const tag = err ? `${COLORS.red}✗${COLORS.reset}` :
                r.status === 200 ? `${COLORS.green}✓${COLORS.reset}` :
                r.status === 307 || r.status === 308 ? `${COLORS.yellow}↪${COLORS.reset}` :
                r.status === 404 ? `${COLORS.yellow}404${COLORS.reset}` :
                `${COLORS.red}?${COLORS.reset}`;
    const loc = r.location ? ` → ${r.location}` : '';
    const size = r.body ? ` (${r.body.length}b)` : '';
    console.log(`  ${tag} ${ruta.padEnd(28)} ${r.status}${loc}${size}`);
    if (err) {
      console.log(`     ${COLORS.red}${err.tipo}: ${err.fragmento}${COLORS.reset}`);
      errores++;
    }
  }
  return errores;
}

const RUTAS_WEB = [
  '/', '/dashboard', '/padron', '/flota', '/choferes', '/polizas',
  '/funerario', '/tesoreria', '/bitacora', '/asambleas', '/honor',
  '/expedientes', '/mipanel',
];

const RUTAS_ADMIN = [
  '/', '/stats', '/usuarios', '/roles', '/modulos',
  '/auditoria', '/sql', '/impersonar', '/jobs', '/backup', '/branding',
];

(async () => {
  console.log(`${COLORS.cyan}E2E test — login y recorrido${COLORS.reset}`);
  info(`Email: ${EMAIL}  · Project: ${projectRef}`);

  let totalErr = 0;
  try {
    totalErr += await test('http://localhost:3000', 'apps/web', RUTAS_WEB);
  } catch (e) {
    fail(`apps/web no respondió: ${e.message}`);
    totalErr++;
  }

  try {
    totalErr += await test('http://localhost:3001', 'apps/admin', RUTAS_ADMIN);
  } catch (e) {
    fail(`apps/admin no respondió: ${e.message}`);
    totalErr++;
  }

  console.log();
  if (totalErr === 0) ok(`Recorrido completo sin errores reales`);
  else fail(`${totalErr} ruta(s) con problemas`);
})();

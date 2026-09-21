// Crea la PRIMERA cuenta de administrador (superadmin) del cliente.
// Uso:  node scripts/crear-admin.mjs correo@cliente.com "Nombre del Administrador"
//
// Crea el usuario en Supabase Auth (con contraseña generada), su perfil y el rol
// superadmin. A partir de esa cuenta, el administrador gestiona a los demás desde
// el Panel de Administración. Ejecutar UNA sola vez.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';

// ── argumentos ──
const email = process.argv[2];
const nombre = process.argv.slice(3).join(' ').trim();
if (!email || !nombre) {
  console.error('Uso: node scripts/crear-admin.mjs correo@cliente.com "Nombre del Administrador"');
  process.exit(1);
}

// ── env ──
const env = {};
for (const l of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE) { console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local'); process.exit(1); }

function genPassword() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(randomBytes(16)).map((b) => a[b % a.length]).join('');
}
const password = genPassword();

// ── 1) crear usuario en Auth ──
const res = await fetch(`${URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { nombre_display: nombre } }),
});
const body = await res.json();
if (!res.ok) { console.error('Error al crear el usuario:', body.msg || body.error_description || JSON.stringify(body)); process.exit(1); }
const userId = body.id;
console.log('✔ Usuario creado en Auth:', email, '(id:', userId + ')');

// ── 2) perfil + rol superadmin ──
const c = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
// Perfil (algunas instalaciones lo crean por trigger; por eso insert-si-no-existe + update).
await c.query(
  `insert into usuarios_perfil (user_id, nombre_display, activo)
   select $1,$2,true where not exists (select 1 from usuarios_perfil where user_id=$1)`,
  [userId, nombre]
);
await c.query(`update usuarios_perfil set nombre_display=$2, activo=true where user_id=$1`, [userId, nombre]);
// Rol superadmin (idempotente).
await c.query(
  `insert into usuarios_roles (user_id, rol_codigo, activo)
   select $1,'superadmin',true
   where not exists (select 1 from usuarios_roles where user_id=$1 and rol_codigo='superadmin')`,
  [userId]
);
await c.end();
console.log('✔ Perfil y rol superadmin asignados.');

console.log('\n════════════════════════════════════════');
console.log('  Correo:      ', email);
console.log('  Contraseña:  ', password);
console.log('════════════════════════════════════════');
console.log('Entrega estas credenciales al administrador. Debe cambiar la contraseña\nen "Mi Panel" tras el primer ingreso.');

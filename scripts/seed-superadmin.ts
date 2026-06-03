/**
 * pnpm db:superadmin
 * Crea el primer usuario superadmin (god-mode de la plataforma).
 *
 * Genera una contraseña aleatoria robusta y la imprime UNA SOLA VEZ.
 * El usuario debería cambiarla en el primer login.
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { env, log, requireEnv } from './_utils.js';

const EMAIL = process.env.SUPERADMIN_EMAIL ?? 'daniel.isaias.st@gmail.com';
const NOMBRE = process.env.SUPERADMIN_NOMBRE ?? 'Daniel Isaías — Super Admin (Dev)';

function generarPassword(): string {
  // 16 chars: a-z A-Z 0-9 con algunos símbolos seguros para URL
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const buf = randomBytes(16);
  let out = '';
  for (const b of buf) out += alfabeto[b % alfabeto.length];
  return out;
}

async function main() {
  log.bold('\n🔐 Creando usuario superadmin\n');
  requireEnv('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');

  const password = generarPassword();
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 1) Crear / recuperar usuario
  log.info('Creando usuario en auth.users...');
  let userId: string;
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    user_metadata: { nombre_display: NOMBRE, es_superadmin: true },
  });

  if (createErr) {
    if (createErr.message.toLowerCase().includes('already')) {
      log.warn(`Usuario ${EMAIL} ya existe. Actualizando password y rol...`);
      const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list.users.find((u) => u.email === EMAIL);
      if (!existing) throw new Error('Usuario existe pero no pude recuperar el ID.');
      userId = existing.id;
      // Resetear password
      const { error: updErr } = await sb.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { ...existing.user_metadata, es_superadmin: true, nombre_display: NOMBRE },
      });
      if (updErr) throw updErr;
    } else {
      throw createErr;
    }
  } else {
    userId = created.user!.id;
  }
  log.ok(`Usuario id=${userId}`);

  // 2) Perfil
  log.info('Configurando perfil...');
  const { error: profErr } = await sb
    .from('usuarios_perfil')
    .upsert({ user_id: userId, nombre_display: NOMBRE, activo: true }, { onConflict: 'user_id' });
  if (profErr) throw profErr;
  log.ok('Perfil OK');

  // 3) Asignar rol superadmin
  log.info('Asignando rol superadmin...');
  const { error: rolErr } = await sb.from('usuarios_roles').upsert(
    {
      user_id: userId,
      rol_codigo: 'superadmin',
      activo: true,
    },
    { onConflict: 'user_id,rol_codigo,scope_sitio_id,scope_area_num' }
  );
  if (rolErr) throw rolErr;
  log.ok('Rol superadmin asignado');

  // 4) Registrar en auditoría
  await sb.from('auditoria').insert({
    user_id: userId,
    user_email: EMAIL,
    rol_activo: 'superadmin',
    accion: 'CREATE_SUPERADMIN',
    entidad: 'usuarios_roles',
    entidad_id: userId,
    valor_despues: { email: EMAIL, rol: 'superadmin' },
    metadata: { script: 'seed-superadmin.ts' },
  });

  // Salida final
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│  CREDENCIALES SUPERADMIN — guarda esto AHORA            │');
  console.log('│  (no se vuelve a mostrar)                               │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log(`│  Email:      ${EMAIL.padEnd(43)}│`);
  console.log(`│  Password:   ${password.padEnd(43)}│`);
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│  URL admin:  http://localhost:3001/login                │');
  console.log('│  (cambia tu password en el primer login)                │');
  console.log('└─────────────────────────────────────────────────────────┘\n');
}

main().catch((e: any) => {
  log.err(`Error: ${e.message}`);
  process.exit(1);
});

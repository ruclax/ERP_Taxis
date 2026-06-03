/**
 * pnpm db:admin
 * Crea el primer usuario administrador (Sec. General) usando Supabase Admin API.
 *
 * Lee credenciales desde variables de entorno:
 *   ADMIN_EMAIL=jorge.hernandez@sutch.mx
 *   ADMIN_PASSWORD=<contraseña-temporal>
 *   ADMIN_NOMBRE="Jorge Alberto Hernández González"
 *
 * Si no están definidas, pregunta interactivamente.
 */
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { env, log, requireEnv } from './_utils.js';

async function ask(question: string, defaultVal?: string): Promise<string> {
  const rl = createInterface({ input, output });
  const ans = await rl.question(`${question}${defaultVal ? ` [${defaultVal}]` : ''}: `);
  rl.close();
  return ans.trim() || defaultVal || '';
}

async function main() {
  log.bold(`\n👤 Crear usuario administrador (Secretario General)\n`);
  requireEnv('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');

  const email = process.env.ADMIN_EMAIL ?? (await ask('Email del Sec. General'));
  const password = process.env.ADMIN_PASSWORD ?? (await ask('Contraseña temporal (mín 8 caracteres)'));
  const nombre = process.env.ADMIN_NOMBRE ?? (await ask('Nombre completo', 'Jorge Alberto Hernández González'));

  if (!email || !password || password.length < 8) {
    log.err('Email obligatorio y contraseña de mínimo 8 caracteres.');
    process.exit(1);
  }

  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 1) Crear usuario en Auth
  log.info('Creando usuario en auth.users...');
  const { data: userRes, error: userErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre_display: nombre },
  });
  if (userErr) {
    if (userErr.message.toLowerCase().includes('already')) {
      log.warn(`Usuario ${email} ya existe. Recuperando ID...`);
      const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list.users.find((u) => u.email === email);
      if (!existing) throw new Error('No pude encontrar el usuario existente.');
      userRes.user = existing as any;
    } else {
      throw userErr;
    }
  }
  const userId = userRes.user!.id;
  log.ok(`Usuario: ${email} (id=${userId})`);

  // 2) Asegurar perfil
  log.info('Configurando perfil...');
  const { error: profErr } = await sb
    .from('usuarios_perfil')
    .upsert({ user_id: userId, nombre_display: nombre }, { onConflict: 'user_id' });
  if (profErr) throw profErr;
  log.ok('Perfil OK');

  // 3) Asignar rol sec_general
  log.info('Asignando rol sec_general...');
  const { error: rolErr } = await sb
    .from('usuarios_roles')
    .upsert(
      {
        user_id: userId,
        rol_codigo: 'sec_general',
        activo: true,
      },
      { onConflict: 'user_id,rol_codigo,scope_sitio_id,scope_area_num' }
    );
  if (rolErr) throw rolErr;
  log.ok('Rol asignado');

  log.bold(`\n🎉 Listo. Inicia sesión con:\n`);
  log.dim(`   Email:      ${email}`);
  log.dim(`   Contraseña: ${password}  (cámbiala en el primer login)\n`);
}

main().catch((e: any) => {
  log.err(`Error: ${e.message}`);
  process.exit(1);
});

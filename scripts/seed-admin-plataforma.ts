/**
 * pnpm db:admin-plataforma
 * Crea/actualiza la cuenta del Administrador de Plataforma del sindicato.
 *
 * El admin_plataforma es el operador contratado por el sindicato que
 * mantiene la plataforma al día (captura correcciones, manda convocatorias,
 * actualiza datos sensibles). No tiene que ser agremiado, pero si lo es,
 * vinculamos su socio_id para que su expediente quede asociado al usuario.
 *
 * Genera contraseña aleatoria robusta, la imprime UNA SOLA VEZ. El operador
 * debe cambiarla en el primer login.
 *
 * Por defecto crea a Jesús Antonio Torres Solís (tony_t1@msn.com), AGR-00603.
 * Para otro operador, exportar ADMIN_EMAIL y ADMIN_NOMBRE.
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { env, log, requireEnv } from './_utils.js';

const EMAIL = process.env.ADMIN_PLATAFORMA_EMAIL ?? 'tony_t1@msn.com';
const NOMBRE = process.env.ADMIN_PLATAFORMA_NOMBRE ?? 'Jesús Antonio Torres Solís';

function generarPassword(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const buf = randomBytes(16);
  let out = '';
  for (const b of buf) out += alfabeto[b % alfabeto.length];
  return out;
}

async function main() {
  log.bold('\n🛠️  Creando usuario Administrador de Plataforma\n');
  requireEnv('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');

  const password = generarPassword();
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 0) Buscar socio_id en el padrón (opcional — si el operador es agremiado)
  log.info('Buscando socio en el padrón…');
  const norm = NOMBRE.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
  const { data: socios, error: socErr } = await sb
    .from('socios')
    .select('id, codigo_agremiado, nombre_completo')
    .ilike('nombre_completo', `%${NOMBRE.split(' ')[0]}%`);
  if (socErr) throw socErr;
  const match = (socios ?? []).find((s) => {
    const nameNorm = s.nombre_completo.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
    return nameNorm === norm;
  });
  let socioId: string | null = null;
  if (match) {
    socioId = match.id;
    log.ok(`Coincide con ${match.codigo_agremiado} ${match.nombre_completo}`);
  } else {
    log.warn(`No se encontró en el padrón a "${NOMBRE}" — se creará la cuenta sin vinculación a socio.`);
  }

  // 1) Crear / recuperar usuario de auth
  log.info('Creando usuario en auth.users…');
  let userId: string;
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    user_metadata: { nombre_display: NOMBRE, es_admin_plataforma: true },
  });

  if (createErr) {
    if (createErr.message.toLowerCase().includes('already')) {
      log.warn(`Usuario ${EMAIL} ya existe. Actualizando password y rol…`);
      const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 500 });
      const existing = list.users.find((u) => u.email === EMAIL);
      if (!existing) throw new Error('Usuario existe pero no pude recuperar el ID.');
      userId = existing.id;
      const { error: updErr } = await sb.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { ...existing.user_metadata, es_admin_plataforma: true, nombre_display: NOMBRE },
      });
      if (updErr) throw updErr;
    } else {
      throw createErr;
    }
  } else {
    userId = created.user!.id;
  }
  log.ok(`Usuario id=${userId}`);

  // 2) Perfil — vincular socio_id si se encontró match
  log.info('Configurando perfil…');
  const perfil: Record<string, unknown> = {
    user_id: userId,
    nombre_display: NOMBRE,
    activo: true,
  };
  if (socioId) perfil.socio_id = socioId;
  const { error: profErr } = await sb
    .from('usuarios_perfil')
    .upsert(perfil, { onConflict: 'user_id' });
  if (profErr) throw profErr;
  log.ok(`Perfil OK${socioId ? ' (vinculado al padrón)' : ''}`);

  // 3) Asignar rol admin_plataforma
  log.info('Asignando rol admin_plataforma…');
  const { error: rolErr } = await sb.from('usuarios_roles').upsert(
    {
      user_id: userId,
      rol_codigo: 'admin_plataforma',
      activo: true,
    },
    { onConflict: 'user_id,rol_codigo,scope_sitio_id,scope_area_num' }
  );
  if (rolErr) throw rolErr;
  log.ok('Rol admin_plataforma asignado');

  // 4) Auditoría
  await sb.from('auditoria').insert({
    user_id: userId,
    user_email: EMAIL,
    rol_activo: 'admin_plataforma',
    accion: 'CREATE_ADMIN_PLATAFORMA',
    entidad: 'usuarios_roles',
    entidad_id: userId,
    valor_despues: { email: EMAIL, rol: 'admin_plataforma', socio_id: socioId },
    metadata: { script: 'seed-admin-plataforma.ts' },
  });

  // Salida final
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│  CREDENCIALES ADMIN DE PLATAFORMA — guarda esto AHORA   │');
  console.log('│  (no se vuelve a mostrar)                               │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log(`│  Email:      ${EMAIL.padEnd(43)}│`);
  console.log(`│  Password:   ${password.padEnd(43)}│`);
  console.log(`│  Nombre:     ${NOMBRE.padEnd(43)}│`);
  if (socioId) {
    console.log(`│  Vinculado:  ${match!.codigo_agremiado.padEnd(43)}│`);
  } else {
    console.log('│  Vinculado:  (sin socio en padrón)                       │');
  }
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│  URL web:    http://localhost:3000/login                │');
  console.log('│  (cambia tu password en el primer login)                │');
  console.log('└─────────────────────────────────────────────────────────┘\n');
}

main().catch((e: any) => {
  log.err(`Error: ${e.message}`);
  process.exit(1);
});

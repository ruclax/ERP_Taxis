/**
 * Crea o actualiza la cuenta de un usuario del comité del sindicato.
 *
 * Recibe parámetros por variables de entorno:
 *   ROL              codigo del rol (sec_general, sec_organizacion, tesorero, ...)
 *   EMAIL            email del usuario
 *   NOMBRE           nombre completo (display + match)
 *   CODIGO_AGREMIADO (opcional) AGR-XXXXX para vincular al socio. Si no se da,
 *                    intenta match por nombre normalizado.
 *   SUPLENTE         "true" si es suplente del rol; default "false"
 *
 * Genera contraseña aleatoria robusta y la imprime UNA SOLA VEZ.
 *
 * Ejemplo:
 *   ROL=sec_general EMAIL=jorgea1972@hotmail.com \
 *   NOMBRE="Jorge Alberto Hernández González" CODIGO_AGREMIADO=AGR-00249 \
 *   pnpm tsx scripts/seed-comite-user.ts
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { env, log, requireEnv } from './_utils.js';

const ROL = process.env.ROL ?? '';
const EMAIL = process.env.EMAIL ?? '';
const NOMBRE = process.env.NOMBRE ?? '';
const CODIGO_AGREMIADO = process.env.CODIGO_AGREMIADO ?? '';
const SUPLENTE = (process.env.SUPLENTE ?? 'false').toLowerCase() === 'true';

const ROLES_VALIDOS = new Set([
  'sec_general', 'sec_organizacion', 'tesorero', 'sec_actas',
  'sec_trabajo', 'honor_justicia', 'hacienda', 'delegado',
]);

function generarPassword(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const buf = randomBytes(16);
  let out = '';
  for (const b of buf) out += alfabeto[b % alfabeto.length];
  return out;
}

function normalizar(s: string): string {
  return s.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  if (!ROL || !ROLES_VALIDOS.has(ROL)) {
    log.err(`ROL inválido: "${ROL}". Debe ser uno de: ${[...ROLES_VALIDOS].join(', ')}`);
    process.exit(1);
  }
  if (!EMAIL || !EMAIL.includes('@')) {
    log.err(`EMAIL inválido: "${EMAIL}"`);
    process.exit(1);
  }
  if (!NOMBRE || NOMBRE.length < 5) {
    log.err(`NOMBRE inválido: "${NOMBRE}"`);
    process.exit(1);
  }

  log.bold(`\n👤 Creando ${SUPLENTE ? 'SUPLENTE' : 'TITULAR'} de ${ROL}\n`);
  requireEnv('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');

  const password = generarPassword();
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 1) Localizar socio_id
  log.info('Localizando socio en el padrón…');
  let socioId: string | null = null;
  let socioInfo: { codigo: string; nombre: string } | null = null;

  if (CODIGO_AGREMIADO) {
    const { data, error } = await sb
      .from('socios')
      .select('id, codigo_agremiado, nombre_completo')
      .eq('codigo_agremiado', CODIGO_AGREMIADO)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      socioId = data.id;
      socioInfo = { codigo: data.codigo_agremiado, nombre: data.nombre_completo };
    }
  } else {
    // Match por nombre normalizado
    const norm = normalizar(NOMBRE);
    const { data, error } = await sb
      .from('socios')
      .select('id, codigo_agremiado, nombre_completo');
    if (error) throw error;
    const match = (data ?? []).find((s) => normalizar(s.nombre_completo) === norm);
    if (match) {
      socioId = match.id;
      socioInfo = { codigo: match.codigo_agremiado, nombre: match.nombre_completo };
    }
  }

  if (!socioInfo) {
    log.err(`No se encontró al socio. Provee CODIGO_AGREMIADO explícito si el nombre no matchea exacto.`);
    process.exit(1);
  }
  log.ok(`Match: ${socioInfo.codigo} · ${socioInfo.nombre}`);

  // 2) Crear/actualizar usuario en auth.users
  log.info('Creando usuario en auth.users…');
  let userId: string;
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    user_metadata: { nombre_display: NOMBRE, rol_inicial: ROL, suplente: SUPLENTE },
  });

  if (createErr) {
    if (createErr.message.toLowerCase().includes('already')) {
      log.warn(`Usuario ${EMAIL} ya existe. Actualizando password y rol…`);
      const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 500 });
      const existing = list.users.find((u) => u.email === EMAIL);
      if (!existing) throw new Error('Usuario existe pero no recupero ID.');
      userId = existing.id;
      const { error: updErr } = await sb.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { ...existing.user_metadata, nombre_display: NOMBRE },
      });
      if (updErr) throw updErr;
    } else {
      throw createErr;
    }
  } else {
    userId = created.user!.id;
  }
  log.ok(`Usuario id=${userId}`);

  // 3) Perfil con socio_id vinculado
  log.info('Configurando perfil con vínculo al padrón…');
  const { error: profErr } = await sb
    .from('usuarios_perfil')
    .upsert({ user_id: userId, nombre_display: NOMBRE, socio_id: socioId, activo: true },
      { onConflict: 'user_id' });
  if (profErr) throw profErr;
  log.ok(`Perfil OK · vinculado a ${socioInfo.codigo}`);

  // 4) Rol
  log.info(`Asignando rol ${ROL}${SUPLENTE ? ' (suplente)' : ' (titular)'}…`);

  // Eliminar duplicados previos del mismo rol para este user (NULL en UNIQUE compuesto = no dedup)
  await sb.from('usuarios_roles')
    .delete()
    .eq('user_id', userId)
    .eq('rol_codigo', ROL)
    .is('scope_sitio_id', null)
    .is('scope_area_num', null);

  const { error: rolErr } = await sb.from('usuarios_roles').insert({
    user_id: userId,
    rol_codigo: ROL,
    activo: true,
    suplente: SUPLENTE,
    desde: new Date().toISOString().slice(0, 10),
  });
  if (rolErr) throw rolErr;
  log.ok('Rol asignado');

  // 5) Auditoría
  await sb.from('auditoria').insert({
    user_id: userId,
    user_email: EMAIL,
    rol_activo: ROL,
    accion: SUPLENTE ? 'CREATE_USER_SUPLENTE' : 'CREATE_USER_TITULAR',
    entidad: 'usuarios_roles',
    entidad_id: userId,
    valor_despues: { email: EMAIL, rol: ROL, suplente: SUPLENTE, socio_id: socioId },
    metadata: { script: 'seed-comite-user.ts' },
  });

  // Salida
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log(`│  CREDENCIALES — guarda esto AHORA (no se vuelve a ver)  │`);
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log(`│  Rol:        ${ROL.padEnd(43)}│`);
  console.log(`│  Tipo:       ${(SUPLENTE ? 'Suplente' : 'Titular').padEnd(43)}│`);
  console.log(`│  Nombre:     ${NOMBRE.padEnd(43)}│`);
  console.log(`│  Vinculado:  ${socioInfo.codigo.padEnd(43)}│`);
  console.log(`│  Email:      ${EMAIL.padEnd(43)}│`);
  console.log(`│  Password:   ${password.padEnd(43)}│`);
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│  URL web:    http://localhost:3000/login                │');
  console.log('│  (que cambie su password en el primer login)            │');
  console.log('└─────────────────────────────────────────────────────────┘\n');
}

main().catch((e: any) => {
  log.err(`Error: ${e.message}`);
  process.exit(1);
});

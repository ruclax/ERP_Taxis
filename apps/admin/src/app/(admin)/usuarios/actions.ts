'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin, createSupabaseServiceRole, getSuperadminUserOrRedirect } from '@/lib/supabase-server';

function genPassword(): string {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const buf = randomBytes(16);
  let out = '';
  for (const b of buf) out += a[b % a.length];
  return out;
}

async function auth() {
  const { user, isAdmin } = await getSuperadminUserOrRedirect();
  if (!user || !isAdmin) throw new Error('No autorizado');
  return user;
}

async function log(action: string, entity: string, entityId: string, before: unknown, after: unknown, success = true, error?: string) {
  const sb = await createSupabaseAdmin();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await createSupabaseServiceRole().from('auditoria').insert({
    user_id: user.id,
    user_email: user.email,
    rol_activo: 'superadmin',
    accion: action,
    entidad: entity,
    entidad_id: entityId,
    valor_antes: (before as never) ?? null,
    valor_despues: (after as never) ?? null,
    exito: success,
    error_mensaje: error ?? null,
  });
}

export async function crearUsuario(input: { email: string; nombre: string }): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  await auth();
  const svc = createSupabaseServiceRole();
  const password = genPassword();

  const { data, error } = await svc.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    user_metadata: { nombre_display: input.nombre },
  });
  if (error) {
    await log('CREATE_USER', 'auth.users', input.email, null, { email: input.email }, false, error.message);
    return { ok: false, error: error.message };
  }
  await svc.from('usuarios_perfil').upsert({ user_id: data.user!.id, nombre_display: input.nombre });
  await log('CREATE_USER', 'auth.users', data.user!.id, null, { email: input.email, nombre: input.nombre });
  revalidatePath('/usuarios');
  return { ok: true, password };
}

export async function eliminarUsuario(userId: string): Promise<{ ok: boolean; error?: string }> {
  await auth();
  const svc = createSupabaseServiceRole();
  const { data: { user: target } } = await svc.auth.admin.getUserById(userId);
  const { error } = await svc.auth.admin.deleteUser(userId);
  if (error) {
    await log('DELETE_USER', 'auth.users', userId, target, null, false, error.message);
    return { ok: false, error: error.message };
  }
  await log('DELETE_USER', 'auth.users', userId, target ?? { id: userId }, null);
  revalidatePath('/usuarios');
  return { ok: true };
}

export async function resetPassword(userId: string): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  await auth();
  const svc = createSupabaseServiceRole();
  const password = genPassword();
  const { error } = await svc.auth.admin.updateUserById(userId, { password });
  if (error) {
    await log('RESET_PASSWORD', 'auth.users', userId, null, null, false, error.message);
    return { ok: false, error: error.message };
  }
  await log('RESET_PASSWORD', 'auth.users', userId, null, { password: '[redacted]' });
  return { ok: true, password };
}

export async function toggleActivo(userId: string, activo: boolean): Promise<{ ok: boolean; error?: string }> {
  await auth();
  const svc = createSupabaseServiceRole();
  const { error } = await svc.from('usuarios_perfil').update({ activo }).eq('user_id', userId);
  if (error) {
    await log('TOGGLE_ACTIVO', 'usuarios_perfil', userId, null, { activo }, false, error.message);
    return { ok: false, error: error.message };
  }
  await log('TOGGLE_ACTIVO', 'usuarios_perfil', userId, null, { activo });
  revalidatePath('/usuarios');
  return { ok: true };
}

export async function asignarRol(userId: string, rolCodigo: string): Promise<{ ok: boolean; error?: string }> {
  await auth();
  const svc = createSupabaseServiceRole();
  const { error } = await svc.from('usuarios_roles').upsert({
    user_id: userId,
    rol_codigo: rolCodigo,
    activo: true,
  }, { onConflict: 'user_id,rol_codigo,scope_sitio_id,scope_area_num' });
  if (error) {
    await log('ASIGNAR_ROL', 'usuarios_roles', userId, null, { rolCodigo }, false, error.message);
    return { ok: false, error: error.message };
  }
  await log('ASIGNAR_ROL', 'usuarios_roles', userId, null, { rolCodigo });
  revalidatePath('/usuarios');
  return { ok: true };
}

export async function quitarRol(userId: string, rolCodigo: string): Promise<{ ok: boolean; error?: string }> {
  await auth();
  const svc = createSupabaseServiceRole();
  const { error } = await svc.from('usuarios_roles').delete().eq('user_id', userId).eq('rol_codigo', rolCodigo);
  if (error) {
    await log('QUITAR_ROL', 'usuarios_roles', userId, { rolCodigo }, null, false, error.message);
    return { ok: false, error: error.message };
  }
  await log('QUITAR_ROL', 'usuarios_roles', userId, { rolCodigo }, null);
  revalidatePath('/usuarios');
  return { ok: true };
}

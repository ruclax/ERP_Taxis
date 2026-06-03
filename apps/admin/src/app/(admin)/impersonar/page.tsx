import { createSupabaseServiceRole } from '@/lib/supabase-server';
import ImpersonarClient from './_components/ImpersonarClient';

export const dynamic = 'force-dynamic';

type AuthUser = { id: string; email?: string };
type PerfilRow = { user_id: string; nombre_display: string };
type RolRow = { user_id: string; rol_codigo: string };
type ImperRow = { id: string; superadmin_user_id: string; target_user_id: string; motivo: string | null; inicio: string; activa: boolean };

export default async function Page() {
  const svc = createSupabaseServiceRole();

  const { data: { users } } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 });
  const authUsers = users as AuthUser[];
  const userIds = authUsers.map((u) => u.id);

  const [{ data: perfilesRaw }, { data: rolesRaw }, { data: activasRaw }] = await Promise.all([
    svc.from('usuarios_perfil').select('*').in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
    svc.from('usuarios_roles').select('*').eq('activo', true),
    svc.from('impersonaciones').select('*').eq('activa', true),
  ]);
  const perfiles = (perfilesRaw ?? []) as unknown as PerfilRow[];
  const roles = (rolesRaw ?? []) as unknown as RolRow[];
  const activas = (activasRaw ?? []) as unknown as ImperRow[];

  const filas = authUsers.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    nombre: perfiles.find((p) => p.user_id === u.id)?.nombre_display ?? u.email ?? '',
    roles: roles.filter((r) => r.user_id === u.id).map((r) => r.rol_codigo),
  })).filter((u) => !u.roles.includes('superadmin'));

  return <ImpersonarClient usuarios={filas} sesionesActivas={activas} />;
}

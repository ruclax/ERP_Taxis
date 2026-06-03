import { createSupabaseServiceRole } from '@/lib/supabase-server';
import UsuariosClient from './_components/UsuariosClient';

export const dynamic = 'force-dynamic';

type AuthUser = { id: string; email?: string; created_at: string; last_sign_in_at?: string | null };
type PerfilRow = { user_id: string; nombre_display: string; activo: boolean };
type RolRow = { user_id: string; rol_codigo: string; activo: boolean };
type RolCat = { codigo: string; nombre: string; orden_jerarquia: number };

export default async function UsuariosPage() {
  const svc = createSupabaseServiceRole();

  const { data: { users } } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 });
  const authUsers = users as AuthUser[];
  const userIds = authUsers.map((u) => u.id);

  const [{ data: perfilesRaw }, { data: rolesRaw }, { data: rolesCatRaw }] = await Promise.all([
    svc.from('usuarios_perfil').select('*').in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
    svc.from('usuarios_roles').select('*').in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
    svc.from('roles').select('codigo, nombre, orden_jerarquia').order('orden_jerarquia'),
  ]);
  const perfiles = (perfilesRaw ?? []) as unknown as PerfilRow[];
  const roles = (rolesRaw ?? []) as unknown as RolRow[];
  const rolesCat = (rolesCatRaw ?? []) as unknown as RolCat[];

  const filas = authUsers.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    nombre_display: perfiles.find((p) => p.user_id === u.id)?.nombre_display ?? u.email ?? '',
    activo: perfiles.find((p) => p.user_id === u.id)?.activo ?? true,
    roles: roles.filter((r) => r.user_id === u.id && r.activo).map((r) => r.rol_codigo),
  }));

  return <UsuariosClient initialUsers={filas} catalogoRoles={rolesCat} />;
}

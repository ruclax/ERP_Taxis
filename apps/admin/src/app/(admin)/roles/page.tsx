import { createSupabaseServiceRole } from '@/lib/supabase-server';
import RolesClient from './_components/RolesClient';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const svc = createSupabaseServiceRole();
  const [{ data: roles }, { data: modulos }] = await Promise.all([
    svc.from('roles').select('*').order('orden_jerarquia'),
    svc.from('modulos_config').select('codigo, nombre').order('codigo'),
  ]);
  return <RolesClient roles={roles ?? []} modulos={modulos ?? []} />;
}

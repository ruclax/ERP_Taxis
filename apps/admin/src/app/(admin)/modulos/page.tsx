import { createSupabaseServiceRole } from '@/lib/supabase-server';
import ModulosClient from './_components/ModulosClient';

export const dynamic = 'force-dynamic';

export default async function ModulosPage() {
  const svc = createSupabaseServiceRole();
  const { data } = await svc.from('modulos_config').select('*').order('codigo');
  return <ModulosClient modulos={data ?? []} />;
}

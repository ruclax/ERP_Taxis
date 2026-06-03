import { createSupabaseServiceRole } from '@/lib/supabase-server';
import AuditoriaClient from './_components/AuditoriaClient';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<{ accion?: string; entidad?: string; user?: string }> }) {
  const sp = await searchParams;
  const svc = createSupabaseServiceRole();
  let q = svc.from('auditoria').select('*').order('created_at', { ascending: false }).limit(200);
  if (sp.accion) q = q.eq('accion', sp.accion);
  if (sp.entidad) q = q.eq('entidad', sp.entidad);
  if (sp.user) q = q.ilike('user_email', `%${sp.user}%`);
  const { data } = await q;
  return <AuditoriaClient eventos={data ?? []} filtros={sp} />;
}

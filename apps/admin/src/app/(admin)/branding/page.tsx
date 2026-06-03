import { createSupabaseServiceRole } from '@/lib/supabase-server';
import BrandingClient from './_components/BrandingClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const svc = createSupabaseServiceRole();
  const { data } = await svc.from('branding_config').select('*').eq('id', 1).single();
  return <BrandingClient initial={data!} />;
}

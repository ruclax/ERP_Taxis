import { cookies } from 'next/headers';
import { createSupabaseServer } from '@erp/db/client/server';
import { listarSitios } from '@erp/db/queries/sitios';
import SitiosView from './_components/SitiosView';

export default async function SitiosPage() {
  const supabase = createSupabaseServer(await cookies());
  const sitios = await listarSitios(supabase, {});
  return <SitiosView sitios={sitios} />;
}

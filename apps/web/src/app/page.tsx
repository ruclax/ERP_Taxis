import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createSupabaseServer } from '@erp/db/client/server';

export default async function Home() {
  const supabase = createSupabaseServer(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? '/dashboard' : '/login');
}

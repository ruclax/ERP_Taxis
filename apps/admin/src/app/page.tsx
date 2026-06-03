import { redirect } from 'next/navigation';
import { getSuperadminUserOrRedirect } from '@/lib/supabase-server';

export default async function Home() {
  const { user, isAdmin } = await getSuperadminUserOrRedirect();
  if (!user || !isAdmin) redirect('/login');
  redirect('/stats');
}

import { redirect } from 'next/navigation';
import { getSuperadminUserOrRedirect } from '@/lib/supabase-server';
import { AdminShell } from './_components/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await getSuperadminUserOrRedirect();
  if (!user || !isAdmin) redirect('/login');

  return <AdminShell userEmail={user.email ?? ''}>{children}</AdminShell>;
}

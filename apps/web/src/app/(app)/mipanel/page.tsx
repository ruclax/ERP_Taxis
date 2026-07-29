import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@erp/db/client/server';
import MiPanelClient from './_components/MiPanelClient';

export default async function MiPanelPage() {
  const sb = createSupabaseServer(await cookies());
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await sb
    .from('usuarios_perfil')
    .select('nombre_display')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { nombre_display: string | null } | null };

  const { data: roles } = await sb
    .from('usuarios_roles')
    .select('rol_codigo')
    .eq('user_id', user.id)
    .eq('activo', true) as { data: { rol_codigo: string }[] | null };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold ink">Mi Panel</h2>
        <p className="mt-1 text-sm text-slate-500">Administra tu cuenta y tu contraseña.</p>
      </div>
      <MiPanelClient
        email={user.email ?? ''}
        nombreDisplay={perfil?.nombre_display ?? ''}
        roles={(roles ?? []).map((r) => r.rol_codigo)}
      />
    </div>
  );
}

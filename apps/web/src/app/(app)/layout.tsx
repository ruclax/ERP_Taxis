import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@erp/db/client/server';
import { AppFrame } from './_components/AppFrame';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServer(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Carga rol activo y perfil para pasar al frame
  type RolRow = { rol_codigo: string; scope_sitio_id: string | null; scope_area_num: number | null; suplente: boolean | null };
  type PerfilRow = { nombre_display: string; avatar_url: string | null };

  const { data: roles } = await supabase
    .from('usuarios_roles')
    .select('rol_codigo, scope_sitio_id, scope_area_num, suplente')
    .eq('user_id', user.id)
    .eq('activo', true) as { data: RolRow[] | null };

  const { data: perfil } = await supabase
    .from('usuarios_perfil')
    .select('nombre_display, avatar_url')
    .eq('user_id', user.id)
    .single() as { data: PerfilRow | null };

  const rolesArr = roles ?? [];
  const esSuperadmin = rolesArr.some((r) => r.rol_codigo === 'superadmin');

  return (
    <AppFrame
      nombreDisplay={perfil?.nombre_display ?? user.email ?? ''}
      esSuperadmin={esSuperadmin}
      roles={rolesArr.map((r) => ({
        rolCodigo: r.rol_codigo as never,
        scopeSitioId: r.scope_sitio_id,
        scopeAreaNum: r.scope_area_num,
        suplente: r.suplente ?? false,
      }))}
    >
      {children}
    </AppFrame>
  );
}

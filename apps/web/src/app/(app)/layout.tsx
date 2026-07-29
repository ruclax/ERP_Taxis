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

  // Catálogo de módulos por rol desde la BD (editable en el admin → la web lo respeta).
  // `expediente` en la BD es un sub-permiso de `padron` (los expedientes viven bajo /padron).
  const { data: rolesCatalogo } = await supabase
    .from('roles')
    .select('codigo, modulos_acceso') as { data: { codigo: string; modulos_acceso: unknown }[] | null };

  const modulosPorRol: Record<string, string[]> = {};
  for (const r of rolesCatalogo ?? []) {
    const mods = Array.isArray(r.modulos_acceso) ? (r.modulos_acceso as string[]) : [];
    modulosPorRol[r.codigo] = [...new Set(mods.map((m) => (m === 'expediente' ? 'padron' : m)))];
  }

  const rolesArr = roles ?? [];
  const esSuperadmin = rolesArr.some((r) => r.rol_codigo === 'superadmin');

  return (
    <AppFrame
      nombreDisplay={perfil?.nombre_display ?? user.email ?? ''}
      esSuperadmin={esSuperadmin}
      modulosPorRol={modulosPorRol}
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

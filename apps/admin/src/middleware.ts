import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@erp/db/types';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n: string) => request.cookies.get(n)?.value,
        set: (n: string, v: string, o: Record<string, unknown>) => response.cookies.set({ name: n, value: v, ...o }),
        remove: (n: string, o: Record<string, unknown>) => response.cookies.set({ name: n, value: '', ...o }),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isLogin = pathname.startsWith('/login');
  const isPublic = isLogin || pathname.startsWith('/_next') || pathname.startsWith('/api/health');

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && !isPublic) {
    // Verificar rol superadmin
    const { data: rolesRaw } = await supabase
      .from('usuarios_roles')
      .select('rol_codigo')
      .eq('user_id', user.id)
      .eq('activo', true);

    const roles = (rolesRaw ?? []) as unknown as Array<{ rol_codigo: string }>;
    const esSuperadmin = roles.some((r) => r.rol_codigo === 'superadmin');
    if (!esSuperadmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'no_autorizado');
      // Cerrar sesión del usuario no-superadmin
      await supabase.auth.signOut();
      return NextResponse.redirect(url);
    }
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

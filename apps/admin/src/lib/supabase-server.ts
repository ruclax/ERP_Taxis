import { createServerClient } from '@supabase/ssr';
import { cookies as nextCookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@erp/db/types';

export async function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = await nextCookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try { cookieStore.set({ name, value, ...options }); } catch {}
      },
      remove(name: string, options: Record<string, unknown>) {
        try { cookieStore.set({ name, value: '', ...options }); } catch {}
      },
    },
  });
}

/** Service role — bypassea TODO. Solo en server, NUNCA expuesta al cliente. */
export function createSupabaseServiceRole() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function getSuperadminUserOrRedirect() {
  const sb = await createSupabaseAdmin();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { user: null, isAdmin: false };

  const { data: rolesRaw } = await sb
    .from('usuarios_roles')
    .select('rol_codigo')
    .eq('user_id', user.id)
    .eq('activo', true);

  const roles = (rolesRaw ?? []) as unknown as Array<{ rol_codigo: string }>;
  const isAdmin = roles.some((r) => r.rol_codigo === 'superadmin');
  return { user, isAdmin };
}

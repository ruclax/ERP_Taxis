// ─────────────────────────────────────────────────────────────
// Clientes Supabase para servidor (Next.js Server Components + Route Handlers)
// ─────────────────────────────────────────────────────────────
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

type CookieStore = {
  get(name: string): { value: string } | undefined;
  set?(opts: { name: string; value: string; [k: string]: unknown }): void;
};

/**
 * Cliente para Server Components y Route Handlers de Next.js.
 * Lee y escribe la sesión desde cookies del request.
 *
 * Uso:
 *   import { cookies } from 'next/headers';
 *   const supabase = createSupabaseServer(await cookies());
 */
export function createSupabaseServer(cookieStore: CookieStore) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient<Database>(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, opts: Record<string, unknown>) {
        try {
          cookieStore.set?.({ name, value, ...opts });
        } catch {
          // Llamado desde Server Component — silenciosamente ignorado;
          // el middleware refresca cookies en estos casos.
        }
      },
      remove(name: string, opts: Record<string, unknown>) {
        try {
          cookieStore.set?.({ name, value: '', ...opts });
        } catch {}
      },
    },
  });
}

/**
 * Cliente admin con service_role — saltea RLS.
 * Solo para uso en scripts del servidor (NUNCA exponer al cliente).
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !sr) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no definida — no se puede crear cliente admin.');
  }
  return createClient<Database>(url, sr, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

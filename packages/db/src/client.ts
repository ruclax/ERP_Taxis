// ─────────────────────────────────────────────────────────────
// Cliente Supabase para componentes del navegador / cliente
// ─────────────────────────────────────────────────────────────
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../types/database';

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Faltan variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa .env.local.'
    );
  }

  _client = createBrowserClient<Database>(url, key);
  return _client;
}

export type BrowserSupabase = ReturnType<typeof getBrowserSupabase>;

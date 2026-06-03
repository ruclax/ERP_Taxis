'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { Lock, Mail, Shield } from 'lucide-react';

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === 'no_autorizado' ? 'No tienes permiso de superadmin para esta consola.' : null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = getBrowserSupabase();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.replace('/');
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--dev-bg) px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--dev-accent) text-white">
            <Shield size={26} />
          </div>
          <h1 className="text-2xl font-bold text-white">Taxi ERP — Admin</h1>
          <p className="mt-1 text-sm text-(--dev-muted)">
            Panel de superadministración (DEV)
          </p>
        </div>

        <div className="rounded-2xl border border-(--dev-border) bg-(--dev-panel) p-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-(--dev-muted)">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--dev-muted)" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-(--dev-border) bg-(--dev-bg) px-3 py-2 pl-9 text-sm text-white focus:border-(--dev-accent) focus:outline-none"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-(--dev-muted)">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--dev-muted)" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-(--dev-border) bg-(--dev-bg) px-3 py-2 pl-9 text-sm text-white focus:border-(--dev-accent) focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-(--dev-accent) py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Verificando…' : 'Entrar al panel'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-(--dev-muted)">
            Acceso restringido. Todas las acciones se registran en auditoría.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-(--dev-muted)">Cargando…</div>}>
      <LoginInner />
    </Suspense>
  );
}

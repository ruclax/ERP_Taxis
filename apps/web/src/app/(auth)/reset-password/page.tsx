'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabase } from '@erp/db/client';
import { Button, Card, CardBody, Input } from '@erp/ui/primitives';
import { Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Errores que Supabase manda en el hash (ej. otp_expired)
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.includes('error')) {
      const p = new URLSearchParams(hash.replace(/^#/, ''));
      setUrlError(
        p.get('error_description')?.replace(/\+/g, ' ') ??
        'El enlace es inválido o expiró. Solicita uno nuevo.'
      );
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    const sb = getBrowserSupabase();
    const { error } = await sb.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(
        /session|Auth session missing/i.test(error.message)
          ? 'El enlace expiró o ya se usó. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".'
          : error.message
      );
    } else {
      setDone(true);
      setTimeout(() => { router.replace('/dashboard'); router.refresh(); }, 1600);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--ink) text-2xl font-bold text-white">TX</div>
          <h1 className="text-2xl font-bold ink">Nueva contraseña</h1>
        </div>

        <Card>
          <CardBody>
            {urlError ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <AlertTriangle size={40} className="text-amber-500" />
                <p className="text-sm text-slate-700">{urlError}</p>
                <Link href="/recuperar" className="text-sm font-medium text-blue-600 hover:underline">
                  Solicitar un enlace nuevo
                </Link>
              </div>
            ) : done ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <CheckCircle2 size={40} className="text-emerald-600" />
                <p className="text-sm text-slate-700">Contraseña actualizada. Entrando…</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <Input
                  label="Nueva contraseña"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  iconLeft={<Lock size={16} />}
                  placeholder="Mínimo 8 caracteres"
                />
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  iconLeft={<Lock size={16} />}
                />
                {error && (
                  <div className="rounded-lg bg-(--crit-bg) px-3 py-2 text-sm text-(--crit)">{error}</div>
                )}
                <Button type="submit" disabled={loading} size="lg">
                  {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

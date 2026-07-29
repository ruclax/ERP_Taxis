'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getBrowserSupabase } from '@erp/db/client';
import { Button, Card, CardBody, Input } from '@erp/ui/primitives';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = getBrowserSupabase();
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--ink) text-2xl font-bold text-white">
            TX
          </div>
          <h1 className="text-2xl font-bold ink">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">Te enviaremos un enlace por correo.</p>
        </div>

        <Card>
          <CardBody>
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <CheckCircle2 size={40} className="text-emerald-600" />
                <p className="text-sm text-slate-700">
                  Si <strong>{email}</strong> tiene una cuenta, te llegó un correo con el enlace para
                  restablecer tu contraseña. Revisa también spam.
                </p>
                <p className="text-xs text-slate-400">El enlace expira pronto — úsalo cuanto antes.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  iconLeft={<Mail size={16} />}
                  placeholder="ejemplo@sutch.mx"
                />
                {error && (
                  <div className="rounded-lg bg-(--crit-bg) px-3 py-2 text-sm text-(--crit)">{error}</div>
                )}
                <Button type="submit" disabled={loading} size="lg">
                  {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>

        <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} /> Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}

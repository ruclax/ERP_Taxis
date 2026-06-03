'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@erp/db/client';
import { Button, Card, CardBody, Input } from '@erp/ui/primitives';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.replace('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--ink) text-2xl font-bold text-white">
            TX
          </div>
          <h1 className="text-2xl font-bold ink">Taxi ERP</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sindicato de Choferes de Sitio de Nuevo Laredo
          </p>
        </div>

        <Card>
          <CardBody>
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
              <Input
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                iconLeft={<Lock size={16} />}
              />
              {error && (
                <div className="rounded-lg bg-(--crit-bg) px-3 py-2 text-sm text-(--crit)">
                  {error}
                </div>
              )}
              <Button type="submit" disabled={loading} size="lg">
                {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400">
          Si no tienes acceso, contacta al Secretario General o al Sec. de Organización.
        </p>
      </div>
    </div>
  );
}

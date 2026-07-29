'use client';

import { useState, useTransition } from 'react';
import { getBrowserSupabase } from '@erp/db/client';
import { Card, CardBody, CardHeader, Button, Input, Badge } from '@erp/ui/primitives';
import { ROLES } from '@erp/auth/rbac';
import { User, Shield, CheckCircle2 } from 'lucide-react';
import { actualizarPerfilAction } from '../actions';

export default function MiPanelClient({
  email, nombreDisplay, roles,
}: {
  email: string;
  nombreDisplay: string;
  roles: string[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <PerfilCard email={email} nombreDisplay={nombreDisplay} roles={roles} />
      <SeguridadCard email={email} />
    </div>
  );
}

function PerfilCard({ email, nombreDisplay, roles }: { email: string; nombreDisplay: string; roles: string[] }) {
  const [nombre, setNombre] = useState(nombreDisplay);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function guardar() {
    setMsg(null);
    startTransition(async () => {
      const r = await actualizarPerfilAction(nombre);
      setMsg(r.ok ? { ok: true, text: 'Perfil actualizado' } : { ok: false, text: r.error });
    });
  }

  return (
    <Card>
      <CardHeader title="Perfil" subtitle="Tus datos de cuenta" />
      <CardBody>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-800">{nombreDisplay || email}</div>
              <div className="truncate text-xs text-slate-500">{email}</div>
            </div>
          </div>

          {roles.length > 0 && (
            <div>
              <div className="label-erp mb-1 flex items-center gap-1.5"><Shield size={13} /> Roles</div>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <Badge key={r} tone="info">{ROLES[r as keyof typeof ROLES]?.nombre ?? r}</Badge>
                ))}
              </div>
            </div>
          )}

          <Input label="Nombre para mostrar" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input label="Correo electrónico" value={email} disabled iconLeft={undefined} />

          {msg && (
            <p className={`rounded-md px-3 py-2 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={guardar} disabled={pending || nombre.trim() === nombreDisplay.trim()}>
              {pending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function SeguridadCard({ email }: { email: string }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function cambiar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (nueva.length < 8) { setMsg({ ok: false, text: 'La nueva contraseña debe tener al menos 8 caracteres' }); return; }
    if (nueva !== confirmar) { setMsg({ ok: false, text: 'Las contraseñas no coinciden' }); return; }
    setLoading(true);
    const sb = getBrowserSupabase();
    // 1) Verificar identidad reautenticando con la contraseña actual
    const { error: e1 } = await sb.auth.signInWithPassword({ email, password: actual });
    if (e1) { setLoading(false); setMsg({ ok: false, text: 'Tu contraseña actual es incorrecta' }); return; }
    // 2) Actualizar a la nueva
    const { error: e2 } = await sb.auth.updateUser({ password: nueva });
    setLoading(false);
    if (e2) { setMsg({ ok: false, text: e2.message }); return; }
    setActual(''); setNueva(''); setConfirmar('');
    setMsg({ ok: true, text: 'Contraseña actualizada correctamente' });
  }

  return (
    <Card>
      <CardHeader title="Seguridad" subtitle="Cambia tu contraseña" />
      <CardBody>
        <form onSubmit={cambiar} className="flex flex-col gap-4">
          <Input label="Contraseña actual" type="password" autoComplete="current-password" required value={actual} onChange={(e) => setActual(e.target.value)} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Nueva contraseña" type="password" autoComplete="new-password" required value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Mínimo 8 caracteres" />
            <Input label="Confirmar nueva" type="password" autoComplete="new-password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          </div>
          {msg && (
            <p className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
              {msg.ok && <CheckCircle2 size={15} />} {msg.text}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Actualizando…' : 'Cambiar contraseña'}</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

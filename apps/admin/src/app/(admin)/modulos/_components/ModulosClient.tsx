'use client';

import { useState, useTransition } from 'react';
import { ToggleRight, Wrench, Flame } from 'lucide-react';
import { actualizarModulo } from '../actions';

interface Modulo {
  codigo: string;
  nombre: string;
  activo: boolean;
  beta: boolean;
  mantenimiento: boolean;
  mensaje_mantenimiento: string | null;
  visible_para_roles: string[];
  notas: string | null;
}

export default function ModulosClient({ modulos }: { modulos: Modulo[] }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function update(codigo: string, updates: Partial<Modulo>) {
    startTransition(async () => {
      const r = await actualizarModulo(codigo, updates as never);
      setMsg(r.ok ? `${codigo} actualizado` : `Error: ${r.error}`);
      setTimeout(() => setMsg(null), 3000);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Feature Flags por Módulo</h1>
        <p className="mt-1 text-sm text-(--dev-muted)">
          Activa, desactiva o pone en mantenimiento cada módulo sin desplegar código.
        </p>
      </div>

      {msg && (
        <div className="rounded-lg border border-(--dev-border) bg-(--dev-panel) px-3 py-2 text-sm text-white">{msg}</div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {modulos.map((m) => (
          <div key={m.codigo} className="rounded-lg border border-(--dev-border) bg-(--dev-panel) p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-white">{m.nombre}</div>
                <div className="mono text-xs text-(--dev-muted)">{m.codigo}</div>
              </div>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                m.mantenimiento ? 'bg-amber-500/15 text-amber-300' :
                !m.activo ? 'bg-red-500/15 text-red-300' :
                'bg-emerald-500/15 text-emerald-300'
              }`}>
                {m.mantenimiento ? 'MANTENIMIENTO' : m.activo ? (m.beta ? 'BETA' : 'ACTIVO') : 'DESACTIVADO'}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <Toggle
                label="Activo"
                icon={<ToggleRight size={14} />}
                checked={m.activo}
                onChange={(v) => update(m.codigo, { activo: v })}
                disabled={pending}
              />
              <Toggle
                label="Beta"
                icon={<Flame size={14} />}
                checked={m.beta}
                onChange={(v) => update(m.codigo, { beta: v })}
                disabled={pending}
              />
              <Toggle
                label="Mantenimiento"
                icon={<Wrench size={14} />}
                checked={m.mantenimiento}
                onChange={(v) => update(m.codigo, { mantenimiento: v })}
                disabled={pending}
              />
            </div>

            <div className="mt-3 text-[10px] text-(--dev-muted)">
              Visible para: <span className="mono">{m.visible_para_roles.length || 'todos'}</span> roles
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, icon, checked, onChange, disabled }: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-2 text-(--dev-muted)">
        {icon} {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-(--dev-bg)'
        } disabled:opacity-50`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>
    </label>
  );
}

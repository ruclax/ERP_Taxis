'use client';

import { useState, useTransition } from 'react';
import { Check, X, Save } from 'lucide-react';
import { actualizarModulosRol } from '../actions';

interface Rol {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  scope_tipo: string;
  modulos_acceso: unknown;
  solo_lectura: boolean;
  orden_jerarquia: number;
}

interface Modulo {
  codigo: string;
  nombre: string;
}

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

export default function RolesClient({ roles, modulos }: { roles: Rol[]; modulos: Modulo[] }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<Record<string, string[]>>(() => {
    const m: Record<string, string[]> = {};
    for (const r of roles) m[r.codigo] = asArray(r.modulos_acceso);
    return m;
  });
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);

  function toggle(rolCodigo: string, modCodigo: string) {
    if (rolCodigo === 'superadmin') return; // No tocar superadmin
    setState((prev) => {
      const cur = prev[rolCodigo] ?? [];
      const has = cur.includes(modCodigo) || cur.includes('*');
      const next = has ? cur.filter((m) => m !== modCodigo && m !== '*') : [...cur, modCodigo];
      return { ...prev, [rolCodigo]: next };
    });
    setDirty((d) => new Set(d).add(rolCodigo));
  }

  function saveRol(codigo: string) {
    const mods = state[codigo] ?? [];
    startTransition(async () => {
      const r = await actualizarModulosRol(codigo, mods);
      if (r.ok) {
        setDirty((d) => { const n = new Set(d); n.delete(codigo); return n; });
        setMsg(`Rol ${codigo} guardado`);
        setTimeout(() => setMsg(null), 3000);
      } else {
        setMsg(`Error: ${r.error}`);
      }
    });
  }

  function hasAccess(rolCodigo: string, modCodigo: string): boolean {
    const acc = state[rolCodigo] ?? [];
    return acc.includes('*') || acc.includes(modCodigo);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Matriz Rol × Módulo</h1>
        <p className="mt-1 text-sm text-(--dev-muted)">
          Define qué módulos puede ver cada rol. El rol superadmin tiene acceso a todo (no editable).
        </p>
      </div>

      {msg && (
        <div className="rounded-lg border border-(--dev-border) bg-(--dev-panel) px-3 py-2 text-sm text-white">
          {msg}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-(--dev-border) bg-(--dev-panel)">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--dev-border) text-left text-xs uppercase tracking-wider text-(--dev-muted)">
              <th className="px-3 py-3 sticky left-0 bg-(--dev-panel) z-10">Rol</th>
              {modulos.map((m) => (
                <th key={m.codigo} className="px-2 py-3 text-center font-medium">
                  <div className="rotate-180 [writing-mode:vertical-rl] whitespace-nowrap">{m.nombre}</div>
                </th>
              ))}
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--dev-border)">
            {roles.map((r) => {
              const isSuperadmin = r.codigo === 'superadmin';
              return (
                <tr key={r.codigo}>
                  <td className="px-3 py-2 sticky left-0 bg-(--dev-panel) z-10">
                    <div className="font-medium text-white">{r.codigo}</div>
                    <div className="text-[10px] text-(--dev-muted) max-w-[180px] truncate">{r.nombre}</div>
                  </td>
                  {modulos.map((m) => (
                    <td key={m.codigo} className="px-2 py-2 text-center">
                      <button
                        disabled={isSuperadmin || pending}
                        onClick={() => toggle(r.codigo, m.codigo)}
                        className={`mx-auto flex h-7 w-7 items-center justify-center rounded ${
                          hasAccess(r.codigo, m.codigo)
                            ? isSuperadmin
                              ? 'bg-(--dev-accent)/20 text-(--dev-accent)'
                              : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-(--dev-bg) text-(--dev-muted) hover:text-white'
                        } ${isSuperadmin ? 'cursor-not-allowed' : ''}`}
                      >
                        {hasAccess(r.codigo, m.codigo) ? <Check size={14} /> : <X size={14} />}
                      </button>
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {dirty.has(r.codigo) && !isSuperadmin && (
                      <button
                        disabled={pending}
                        onClick={() => saveRol(r.codigo)}
                        className="flex items-center gap-1 rounded bg-(--dev-accent) px-2 py-1 text-xs text-white hover:bg-red-600"
                      >
                        <Save size={12} /> Guardar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-(--dev-muted)">
        ⓘ Cambios se guardan por rol. Cada rol con cambios pendientes muestra un botón "Guardar".
      </p>
    </div>
  );
}

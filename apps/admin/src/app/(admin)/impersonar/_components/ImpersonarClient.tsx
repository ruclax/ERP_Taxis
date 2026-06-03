'use client';

import { useState, useTransition } from 'react';
import { Eye, Search, ExternalLink, StopCircle } from 'lucide-react';
import { iniciarImpersonacion, terminarImpersonacion } from '../actions';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  roles: string[];
}

interface Sesion {
  id: string;
  target_user_id: string;
  motivo: string | null;
  inicio: string;
}

export default function ImpersonarClient({
  usuarios, sesionesActivas,
}: { usuarios: Usuario[]; sesionesActivas: Sesion[] }) {
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState('');
  const [target, setTarget] = useState<Usuario | null>(null);
  const [motivo, setMotivo] = useState('');
  const [link, setLink] = useState<string | null>(null);

  const filtered = usuarios.filter((u) =>
    u.email.toLowerCase().includes(q.toLowerCase()) ||
    u.nombre.toLowerCase().includes(q.toLowerCase())
  );

  function iniciar() {
    if (!target) return;
    startTransition(async () => {
      const r = await iniciarImpersonacion(target.id, motivo);
      if (r.ok && r.magicLink) setLink(r.magicLink);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Impersonación</h1>
        <p className="mt-1 text-sm text-(--dev-muted)">
          Inicia sesión como otro usuario para reproducir problemas. Toda impersonación se registra.
        </p>
      </div>

      {sesionesActivas.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
            {sesionesActivas.length} impersonación(es) activa(s)
          </div>
          {sesionesActivas.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <span className="text-amber-200">
                Target: {s.target_user_id} — {s.motivo ?? 'sin motivo'} — desde {new Date(s.inicio).toLocaleString('es-MX')}
              </span>
              <button
                onClick={() => startTransition(async () => { await terminarImpersonacion(s.id); })}
                className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-1 text-red-300 hover:bg-red-500/30"
              >
                <StopCircle size={12} /> Terminar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Selector */}
        <div className="rounded-lg border border-(--dev-border) bg-(--dev-panel) p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">1. Selecciona usuario</h2>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--dev-muted)" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="w-full rounded-lg border border-(--dev-border) bg-(--dev-bg) py-2 pl-9 pr-3 text-sm text-white"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto rounded border border-(--dev-border)">
            {filtered.slice(0, 50).map((u) => (
              <button
                key={u.id}
                onClick={() => setTarget(u)}
                className={`flex w-full items-center justify-between gap-2 border-b border-(--dev-border) px-3 py-2 text-left text-sm last:border-b-0 ${
                  target?.id === u.id ? 'bg-(--dev-accent)/15 text-white' : 'text-(--dev-muted) hover:bg-(--dev-bg)/50 hover:text-white'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate">{u.nombre}</div>
                  <div className="mono text-xs opacity-60">{u.email}</div>
                </div>
                <div className="flex gap-0.5">
                  {u.roles.map((r) => (
                    <span key={r} className="rounded bg-(--dev-panel) px-1 py-0.5 text-[9px]">{r}</span>
                  ))}
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="px-3 py-6 text-center text-xs text-(--dev-muted)">Sin resultados</div>}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-(--dev-border) bg-(--dev-panel) p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">2. Inicia impersonación</h2>
          {target ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-(--dev-bg) p-3">
                <div className="text-xs text-(--dev-muted)">Target</div>
                <div className="font-medium text-white">{target.nombre}</div>
                <div className="mono text-xs text-(--dev-muted)">{target.email}</div>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-(--dev-muted)">Motivo</span>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="ej. Depurar reporte de error #123"
                  className="rounded-lg border border-(--dev-border) bg-(--dev-bg) px-3 py-2 text-sm text-white"
                />
              </label>
              <button
                onClick={iniciar}
                disabled={pending || !motivo.trim()}
                className="flex items-center justify-center gap-2 rounded-lg bg-(--dev-accent) py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                <Eye size={14} /> Generar magic link
              </button>

              {link && (
                <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className="text-xs font-semibold text-emerald-300 mb-1">Magic link generado</div>
                  <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 break-all text-xs text-emerald-200 underline hover:text-emerald-100">
                    {link} <ExternalLink size={12} />
                  </a>
                  <p className="mt-2 text-[10px] text-emerald-200/70">
                    Abre este link en una ventana de incógnito. Al abrirlo, iniciarás sesión como el usuario destino.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-(--dev-muted)">Selecciona un usuario en la lista de la izquierda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

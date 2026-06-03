'use client';

import { useState, useTransition } from 'react';
import { PlayCircle, RefreshCw, Calendar, Trash2 } from 'lucide-react';
import {
  jobRecalcularEstadoPolizas,
  jobLimpiarSesionesImpersonacion,
  jobGenerarAdeudosMes,
} from '../actions';

const JOBS = [
  {
    id: 'recalc_polizas',
    nombre: 'Recalcular estado de pólizas',
    descripcion: 'Actualiza el estado (VIGENTE / POR_VENCER / VENCIDA) de todas las pólizas según fecha actual.',
    icon: <RefreshCw size={18} />,
    fn: jobRecalcularEstadoPolizas,
  },
  {
    id: 'limpiar_impersonacion',
    nombre: 'Cerrar impersonaciones viejas',
    descripcion: 'Termina sesiones de impersonación abiertas hace más de 1 hora.',
    icon: <Trash2 size={18} />,
    fn: jobLimpiarSesionesImpersonacion,
  },
  {
    id: 'generar_adeudos',
    nombre: 'Generar adeudos del mes',
    descripcion: 'Crea registros de cuota mensual pendiente para socios activos.',
    icon: <Calendar size={18} />,
    fn: jobGenerarAdeudosMes,
  },
];

export default function JobsClient() {
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<Record<string, { ok: boolean; data?: unknown; error?: string; ts: number }>>({});

  function run(job: typeof JOBS[number]) {
    startTransition(async () => {
      const r = await job.fn();
      setResults((prev) => ({ ...prev, [job.id]: { ok: r.ok, data: r, error: 'error' in r ? r.error : undefined, ts: Date.now() } }));
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Jobs</h1>
        <p className="mt-1 text-sm text-(--dev-muted)">
          Tareas administrativas que se ejecutan bajo demanda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {JOBS.map((job) => {
          const res = results[job.id];
          return (
            <div key={job.id} className="rounded-lg border border-(--dev-border) bg-(--dev-panel) p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-(--dev-bg) p-2 text-(--dev-muted)">{job.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white">{job.nombre}</div>
                  <p className="mt-1 text-xs text-(--dev-muted)">{job.descripcion}</p>
                </div>
              </div>
              <button
                onClick={() => run(job)}
                disabled={pending}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-(--dev-accent) py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                <PlayCircle size={14} /> Ejecutar
              </button>
              {res && (
                <div className={`mt-3 rounded border px-2 py-2 text-xs ${
                  res.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' :
                           'border-red-500/30 bg-red-500/10 text-red-200'
                }`}>
                  {res.ok ? '✓ Completado' : `✗ ${res.error ?? 'Error'}`}
                  <pre className="mt-1 mono text-[10px] opacity-80">{JSON.stringify(res.data, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

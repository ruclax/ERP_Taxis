'use client';

import { useState, useTransition } from 'react';
import { Play, AlertTriangle, Clock, Hash } from 'lucide-react';
import { ejecutarSql } from '../actions';

const PRESETS = [
  { label: 'Conteos por tabla', sql: `select 'socios' as tabla, count(*) from socios union all
select 'concesiones', count(*) from concesiones union all
select 'vehiculos', count(*) from vehiculos union all
select 'polizas', count(*) from polizas;` },
  { label: 'Usuarios activos', sql: `select up.nombre_display, au.email, array_agg(ur.rol_codigo) as roles
from usuarios_perfil up
join auth.users au on au.id = up.user_id
left join usuarios_roles ur on ur.user_id = up.user_id and ur.activo = true
group by up.nombre_display, au.email
order by up.nombre_display;` },
  { label: 'Pólizas próximas a vencer (30d)', sql: `select v.placas, p.numero_poliza, p.fecha_vencimiento, p.fecha_vencimiento - current_date as dias
from polizas p
join vehiculos v on v.id = p.vehiculo_id
where p.estado <> 'CANCELADA' and p.fecha_vencimiento between current_date and current_date + 30
order by p.fecha_vencimiento;` },
  { label: 'Tablas y filas', sql: `select schemaname, relname, n_live_tup as filas
from pg_stat_user_tables where schemaname='public' order by n_live_tup desc;` },
];

export default function SqlClient() {
  const [sql, setSql] = useState('select count(*) from socios;');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Awaited<ReturnType<typeof ejecutarSql>> | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  function run(confirmado = false) {
    setNeedsConfirm(false);
    startTransition(async () => {
      const r = await ejecutarSql(sql, confirmado);
      setResult(r);
      if (!r.ok && r.needsConfirm) setNeedsConfirm(true);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">SQL Console</h1>
        <p className="mt-1 text-sm text-(--dev-muted)">
          Ejecuta SQL directo contra Postgres (saltea RLS via service_role). Toda ejecución se registra.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setSql(p.sql)}
            className="rounded border border-(--dev-border) bg-(--dev-panel) px-2 py-1 text-xs text-(--dev-muted) hover:text-white"
          >
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        rows={10}
        spellCheck={false}
        className="w-full rounded-lg border border-(--dev-border) bg-(--dev-panel) p-3 text-sm mono text-white focus:border-(--dev-accent) focus:outline-none"
        placeholder="-- Escribe tu SQL aquí"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-(--dev-muted)">
          ⓘ Operaciones de escritura (INSERT/UPDATE/DELETE/DROP/ALTER) requieren confirmación adicional.
        </p>
        <button
          onClick={() => run(false)}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-(--dev-accent) px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          <Play size={14} /> {pending ? 'Ejecutando…' : 'Ejecutar'}
        </button>
      </div>

      {needsConfirm && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle size={16} />
            <span className="text-sm font-semibold">Operación de escritura detectada</span>
          </div>
          <p className="mt-1 text-xs text-amber-200/80">
            Esta query parece modificar datos. Si estás seguro de lo que haces, confirma.
          </p>
          <button
            onClick={() => run(true)}
            className="mt-2 rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
          >
            Confirmar y ejecutar
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-(--dev-border) bg-(--dev-panel)">
          {result.ok ? (
            <>
              <div className="flex items-center gap-4 border-b border-(--dev-border) px-3 py-2 text-xs text-(--dev-muted)">
                <span className="flex items-center gap-1 text-emerald-300"><Hash size={12} /> {result.rowCount} filas</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {result.ms} ms</span>
              </div>
              {result.rows.length > 0 ? (
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="border-b border-(--dev-border) text-left text-xs text-(--dev-muted)">
                      <tr>
                        {result.columns.map((c) => <th key={c} className="px-3 py-2 mono">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--dev-border)">
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          {result.columns.map((c) => (
                            <td key={c} className="px-3 py-1.5 mono text-xs whitespace-nowrap">
                              {formatCell(row[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-3 py-4 text-center text-xs text-(--dev-muted)">Sin filas devueltas</div>
              )}
            </>
          ) : (
            <div className="px-3 py-3">
              <div className="text-sm font-semibold text-red-300">Error</div>
              <pre className="mt-1 text-xs text-red-200 whitespace-pre-wrap">{result.error}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

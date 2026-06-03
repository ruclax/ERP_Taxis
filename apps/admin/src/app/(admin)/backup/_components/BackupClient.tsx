'use client';

import { useEffect, useState, useTransition } from 'react';
import { Download, Database } from 'lucide-react';
import { exportarTabla, listarTablas } from '../actions';

export default function BackupClient() {
  const [tablas, setTablas] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { listarTablas().then(setTablas); }, []);

  function descargar(tabla: string, formato: 'json' | 'csv') {
    startTransition(async () => {
      const r = await exportarTabla(tabla);
      if (!r.ok) { setMsg(`Error: ${r.error}`); return; }

      let content: string;
      let mime: string;
      if (formato === 'json') {
        content = JSON.stringify(r.rows, null, 2);
        mime = 'application/json';
      } else {
        // CSV
        const escape = (v: unknown) => {
          if (v === null || v === undefined) return '';
          const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
          return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const header = r.columns.join(',');
        const lines = r.rows.map((row) => r.columns.map((c) => escape((row as Record<string, unknown>)[c])).join(','));
        content = [header, ...lines].join('\n');
        mime = 'text/csv';
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tabla}-${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.${formato}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg(`Descargado ${tabla}.${formato} (${r.rows.length} filas)`);
      setTimeout(() => setMsg(null), 4000);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Backup / Export</h1>
        <p className="mt-1 text-sm text-(--dev-muted)">
          Descarga el contenido de cualquier tabla como JSON o CSV. Límite 50,000 filas por export.
        </p>
      </div>

      {msg && (
        <div className="rounded-lg border border-(--dev-border) bg-(--dev-panel) px-3 py-2 text-sm text-white">{msg}</div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {tablas.map((t) => (
          <div key={t} className="flex items-center justify-between rounded-lg border border-(--dev-border) bg-(--dev-panel) p-3">
            <div className="flex items-center gap-2 min-w-0">
              <Database size={14} className="text-(--dev-muted) shrink-0" />
              <span className="mono text-sm text-white truncate">{t}</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => descargar(t, 'json')}
                disabled={pending}
                className="flex items-center gap-1 rounded border border-(--dev-border) px-2 py-1 text-xs text-(--dev-muted) hover:text-white"
              >
                <Download size={12} /> JSON
              </button>
              <button
                onClick={() => descargar(t, 'csv')}
                disabled={pending}
                className="flex items-center gap-1 rounded border border-(--dev-border) px-2 py-1 text-xs text-(--dev-muted) hover:text-white"
              >
                <Download size={12} /> CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

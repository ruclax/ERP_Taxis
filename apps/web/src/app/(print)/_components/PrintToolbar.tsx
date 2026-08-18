'use client';

import { Printer, ArrowLeft } from 'lucide-react';

/** Barra superior (no se imprime): volver + imprimir/guardar PDF. */
export default function PrintToolbar({ volverHref, titulo }: { volverHref: string; titulo: string }) {
  return (
    <div className="no-print mb-4 flex items-center justify-between gap-3">
      <a href={volverHref} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Volver
      </a>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-400 sm:inline">{titulo}</span>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          <Printer size={16} /> Imprimir / Guardar PDF
        </button>
      </div>
    </div>
  );
}

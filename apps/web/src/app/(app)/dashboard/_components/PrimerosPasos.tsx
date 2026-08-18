'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Modal } from '@erp/ui/primitives';
import { Sparkles, Search, Car, HelpCircle, Printer, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'erp.onboarding.primerospasos.v1';

const PASOS = [
  { icon: <Search size={18} />, titulo: 'Busca lo que necesites', texto: 'En Padrón o Flota, escribe un nombre, placas, concesión o RFC. Aparecen sugerencias al instante.', href: '/padron', cta: 'Ir al Padrón' },
  { icon: <Car size={18} />, titulo: 'Revisa flota y pólizas', texto: 'Consulta cada unidad y el estado de su póliza (se calcula solo por fecha: vigente, por vencer o vencida).', href: '/flota', cta: 'Ver la Flota' },
  { icon: <Printer size={18} />, titulo: 'Imprime o guarda en PDF', texto: 'Desde un expediente o ficha, el botón Imprimir abre una vista lista para imprimir o guardar como PDF.', href: null, cta: null },
  { icon: <HelpCircle size={18} />, titulo: 'Consulta el manual', texto: 'El Centro de Ayuda tiene la guía completa por tarea, y puedes descargarla como manual PDF.', href: '/ayuda', cta: 'Abrir la Ayuda' },
];

/** Bienvenida de "Primeros pasos": se abre sola la primera vez y se puede reabrir con el botón. */
export default function PrimerosPasos() {
  const [open, setOpen] = useState(false);

  // Auto-abrir solo si nunca se ha visto (en este navegador).
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch { /* localStorage no disponible: no pasa nada */ }
  }, []);

  function marcarVisto() {
    try { window.localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* noop */ }
  }
  function cerrar() {
    marcarVisto();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
      >
        <Sparkles size={15} /> Primeros pasos
      </button>

      {open && (
        <Modal title="Bienvenido a la plataforma del Sindicato" onClose={cerrar} size="2xl">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Esta es tu herramienta para gestionar agremiados, concesiones, flota, pólizas y sitios — todo en un solo lugar.
              Aquí tienes lo esencial para empezar:
            </p>

            <ul className="flex flex-col gap-2.5">
              {PASOS.map((p) => (
                <li key={p.titulo} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">{p.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800">{p.titulo}</div>
                    <p className="text-sm text-slate-500">{p.texto}</p>
                  </div>
                  {p.href && (
                    <Link
                      href={p.href}
                      onClick={cerrar}
                      className="mt-0.5 inline-flex shrink-0 items-center gap-1 self-center rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                    >
                      {p.cta} <ArrowRight size={12} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-400">Puedes volver a abrir esto con el botón “Primeros pasos”.</span>
              <button
                type="button"
                onClick={cerrar}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
              >
                Entendido
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

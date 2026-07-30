'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '../cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Lado desde el que entra el panel. Default 'right'. */
  side?: 'left' | 'right';
  /** Ancho del panel (clase Tailwind). Default 'w-[340px]'. */
  widthClass?: string;
  children: ReactNode;
}

/** Panel lateral deslizante (off-canvas) con backdrop. Cierra con Escape o clic fuera. */
export function Drawer({ open, onClose, title = 'Filtros', side = 'right', widthClass = 'w-[340px]', children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal={open || undefined}
        aria-label={title}
        className={cn(
          'fixed inset-y-0 z-50 flex max-w-[90vw] flex-col bg-white shadow-xl transition-transform duration-200',
          widthClass,
          side === 'right' ? 'right-0' : 'left-0',
          open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full'
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-base font-semibold ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}

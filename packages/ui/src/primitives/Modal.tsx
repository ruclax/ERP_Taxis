'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Ancho máximo del panel. Default `xl`. */
  size?: 'md' | 'lg' | 'xl' | '2xl';
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

/** Modal simple centrado con overlay. Cierra con Escape o clic en la ✕. */
export function Modal({ title, children, onClose, size = 'xl' }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        className={cn('w-full rounded-2xl bg-white shadow-xl', SIZES[size])}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold ink">{title}</h3>
          <button
            onClick={onClose}
            className="tap-target rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

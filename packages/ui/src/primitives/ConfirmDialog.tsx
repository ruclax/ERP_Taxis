'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../cn';

export type ConfirmTone = 'danger' | 'warn' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** Texto que el usuario debe tipear para habilitar el botón confirmar */
  typedConfirmation?: string;
  loading?: boolean;
}

const TONE_BG: Record<ConfirmTone, string> = {
  danger: 'bg-red-100 text-red-700',
  warn:   'bg-amber-100 text-amber-700',
  info:   'bg-sky-100 text-sky-700',
};

const TONE_BTN: Record<ConfirmTone, string> = {
  danger: 'bg-red-700 hover:bg-red-800',
  warn:   'bg-amber-600 hover:bg-amber-700',
  info:   'bg-sky-700 hover:bg-sky-800',
};

/**
 * Modal de confirmación accesible para acciones destructivas.
 * - Botones grandes (48px+), texto natural en español
 * - Foco inicial al "Cancelar" (más seguro)
 * - Escape cierra
 * - Opcional: typedConfirmation requiere que el usuario escriba una palabra
 */
export function ConfirmDialog({
  open, onClose, onConfirm,
  title, description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  typedConfirmation,
  loading,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [typed, setTyped] = useState('');

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setTyped('');
      cancelRef.current?.focus();
    }
  }, [open]);

  // Escape para cerrar
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirmEnabled = !loading && (
    !typedConfirmation || typed.trim().toUpperCase() === typedConfirmation.toUpperCase()
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-start gap-4 p-6">
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', TONE_BG[tone])}>
            <AlertTriangle size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-title" className="text-lg font-bold text-slate-900">{title}</h2>
            {description && (
              <div className="mt-2 text-[15px] leading-relaxed text-slate-700">{description}</div>
            )}
            {typedConfirmation && (
              <div className="mt-4">
                <label className="label-erp">
                  Para confirmar, escribe <strong className="text-red-700">{typedConfirmation}</strong>
                </label>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="tap-target rounded-lg border border-slate-300 bg-white px-5 text-[15px] font-medium text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmEnabled}
            className={cn(
              'tap-target rounded-lg px-5 text-[15px] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed',
              TONE_BTN[tone]
            )}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

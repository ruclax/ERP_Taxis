'use client';

import { useState, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../cn';

export interface WizardStep {
  id: string;
  /** Etiqueta del paso (visible en el stepper superior) */
  label: string;
  /** Descripción opcional debajo del label */
  description?: string;
  /** Contenido del paso (campos, formulario, etc.) */
  render: () => ReactNode;
  /** Validación: si retorna false o string (mensaje), no permite avanzar */
  canContinue?: () => boolean | string;
}

export interface WizardProps {
  steps: WizardStep[];
  /** Estado del paso actual (controlado) */
  currentStep: number;
  /** Callback al cambiar de paso */
  onStepChange: (step: number) => void;
  /** Callback al terminar el último paso */
  onComplete?: () => void | Promise<void>;
  /** Etiqueta del botón "siguiente" (último paso lo cambia a "finalizar") */
  nextLabel?: string;
  /** Etiqueta del botón "anterior" */
  prevLabel?: string;
  /** Etiqueta del botón final */
  completeLabel?: string;
  loading?: boolean;
}

/**
 * Wizard de varios pasos para formularios largos.
 * - Stepper superior con números/checkmarks
 * - Cada paso puede tener su validación con `canContinue`
 * - Botones grandes "Atrás" / "Siguiente"
 * - Diseñado para usuarios mayores: progreso visual claro, no sorpresas
 */
export function Wizard({
  steps, currentStep, onStepChange, onComplete,
  nextLabel = 'Siguiente',
  prevLabel = 'Atrás',
  completeLabel = 'Finalizar',
  loading,
}: WizardProps) {
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const [error, setError] = useState<string | null>(null);

  function tryContinue() {
    setError(null);
    const valid = step.canContinue?.();
    if (valid === false) {
      setError('Completa los campos requeridos antes de continuar');
      return;
    }
    if (typeof valid === 'string') {
      setError(valid);
      return;
    }
    if (isLast) {
      onComplete?.();
    } else {
      onStepChange(currentStep + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper visual */}
      <ol className="flex items-center gap-2" aria-label={`Paso ${currentStep + 1} de ${steps.length}`}>
        {steps.map((s, i) => {
          const done = i < currentStep;
          const current = i === currentStep;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                  done && 'border-emerald-600 bg-emerald-600 text-white',
                  current && 'border-(--crit) bg-(--crit) text-white ring-4 ring-(--crit-bg)',
                  !done && !current && 'border-slate-300 bg-white text-slate-400'
                )}
                aria-current={current ? 'step' : undefined}
              >
                {done ? <Check size={18} /> : i + 1}
              </div>
              <div className="hidden min-w-0 flex-1 sm:block">
                <div className={cn(
                  'truncate text-sm font-semibold',
                  current ? 'text-slate-900' : done ? 'text-emerald-700' : 'text-slate-500'
                )}>
                  {s.label}
                </div>
                {s.description && (
                  <div className="truncate text-xs text-slate-500">{s.description}</div>
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('hidden h-0.5 flex-1 rounded sm:block', done ? 'bg-emerald-600' : 'bg-slate-200')} />
              )}
            </li>
          );
        })}
      </ol>

      {/* Contenido del paso */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">{step.label}</h2>
          {step.description && <p className="mt-1 text-sm text-slate-500">{step.description}</p>}
        </div>
        {step.render()}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0 || loading}
          className="tap-target inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-[15px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} /> {prevLabel}
        </button>
        <div className="text-sm text-slate-500">
          Paso <strong className="text-slate-900">{currentStep + 1}</strong> de {steps.length}
        </div>
        <button
          type="button"
          onClick={tryContinue}
          disabled={loading}
          className="tap-target inline-flex items-center gap-2 rounded-lg bg-(--oxford) px-5 text-[15px] font-semibold text-white hover:bg-(--crit) disabled:opacity-50"
        >
          {loading ? 'Guardando…' : isLast ? completeLabel : nextLabel}
          {!isLast && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: ReactNode;
  /** Muestra spinner a la derecha; útil para búsquedas en vivo */
  loading?: boolean;
  /** Si se pasa, aparece botón X que llama a esta función. El input debe ser controlado. */
  onClear?: () => void;
  /** Tamaño del input (afecta padding y altura) */
  inputSize?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'py-1.5 text-sm',
  md: 'py-2 text-[15px]',
  lg: 'py-3 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, iconLeft, loading, onClear, inputSize = 'md', className, id, value, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? `inp-${autoId}`;
    const hasValue = value !== undefined && value !== null && value !== '';
    const showClear = !!onClear && hasValue && !loading;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="label-erp">
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            value={value}
            className={cn(
              'block w-full rounded-lg border bg-white px-3 text-slate-900 placeholder:text-slate-400 transition-colors',
              'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200',
              SIZES[inputSize],
              iconLeft && 'pl-9',
              (showClear || loading) && 'pr-9',
              error ? 'border-(--crit-border)' : 'border-slate-300',
              className
            )}
            {...rest}
          />
          {loading && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
            </span>
          )}
          {showClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Limpiar"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
        {error && <p className="text-xs text-(--crit)">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

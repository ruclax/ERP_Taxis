import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface TabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: ReactNode; count?: number }>;
  scrollable?: boolean;
  className?: string;
}

export function Tabs<T extends string>({ value, onChange, options, scrollable, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 border-b border-slate-200',
        scrollable && 'overflow-x-auto whitespace-nowrap',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-(--crit) text-(--ink)'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                active ? 'bg-(--crit-bg) text-(--crit)' : 'bg-slate-100 text-slate-500'
              )}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

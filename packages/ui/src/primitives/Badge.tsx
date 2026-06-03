import type { HTMLAttributes } from 'react';
import { cn } from '../cn';

type Tone = 'neutral' | 'success' | 'warn' | 'critical' | 'info' | 'pending';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const TONE_CLS: Record<Tone, string> = {
  neutral:  'bg-slate-100 text-slate-700',
  success:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warn:     'bg-amber-50 text-amber-800 ring-amber-200',
  critical: 'bg-(--crit-bg) text-(--crit) ring-(--crit-border)',
  info:     'bg-sky-50 text-sky-700 ring-sky-200',
  pending:  'bg-slate-50 text-slate-500 ring-slate-200',
};

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONE_CLS[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

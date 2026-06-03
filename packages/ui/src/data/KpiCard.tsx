import type { ReactNode } from 'react';
import { cn } from '../cn';

type Tone = 'default' | 'critical' | 'success' | 'warn';

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  trend?: { up: boolean; pct: number };
  className?: string;
}

const TONE_CLS: Record<Tone, string> = {
  default:  'border-slate-200',
  critical: 'border-(--crit-border) alert-shadow',
  success:  'border-emerald-200',
  warn:     'border-amber-200',
};

const VALUE_TONE: Record<Tone, string> = {
  default:  'text-slate-900',
  critical: 'text-(--crit)',
  success:  'text-emerald-700',
  warn:     'text-amber-800',
};

export function KpiCard({ label, value, hint, icon, tone = 'default', trend, className }: KpiCardProps) {
  return (
    <div className={cn('rounded-2xl border bg-white px-5 py-4', TONE_CLS[tone], className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="label-erp">{label}</p>
          <p className={cn('mt-1 text-3xl font-bold num tabular-nums', VALUE_TONE[tone])}>
            {value}
          </p>
          {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
          {trend && (
            <p className={cn('mt-1 text-xs font-medium', trend.up ? 'text-emerald-600' : 'text-(--crit)')}>
              {trend.up ? '▲' : '▼'} {trend.pct.toFixed(1)}%
            </p>
          )}
        </div>
        {icon && <div className="shrink-0 text-slate-400">{icon}</div>}
      </div>
    </div>
  );
}

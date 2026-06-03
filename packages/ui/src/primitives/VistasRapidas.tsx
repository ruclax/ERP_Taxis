'use client';

import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface VistaRapidaItem {
  id: string;
  label: string;
  description?: string;
  icon: ReactNode;
  tone?: 'default' | 'accent' | 'warn' | 'success';
  count?: number | null;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

const TONES = {
  default: {
    base: 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
    active: 'border-(--ink) bg-(--ink) text-white',
    badge: 'bg-slate-100 text-slate-700',
    badgeActive: 'bg-white/20 text-white',
    icon: 'text-slate-600',
    iconActive: 'text-white',
  },
  accent: {
    base: 'border-rose-200 bg-rose-50/40 hover:border-rose-300 hover:bg-rose-50',
    active: 'border-(--crit) bg-(--crit) text-white',
    badge: 'bg-rose-100 text-rose-800',
    badgeActive: 'bg-white/20 text-white',
    icon: 'text-rose-700',
    iconActive: 'text-white',
  },
  warn: {
    base: 'border-amber-200 bg-amber-50/40 hover:border-amber-300 hover:bg-amber-50',
    active: 'border-amber-600 bg-amber-600 text-white',
    badge: 'bg-amber-100 text-amber-900',
    badgeActive: 'bg-white/20 text-white',
    icon: 'text-amber-700',
    iconActive: 'text-white',
  },
  success: {
    base: 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50',
    active: 'border-emerald-700 bg-emerald-700 text-white',
    badge: 'bg-emerald-100 text-emerald-900',
    badgeActive: 'bg-white/20 text-white',
    icon: 'text-emerald-700',
    iconActive: 'text-white',
  },
} as const;

export interface VistasRapidasProps {
  items: VistaRapidaItem[];
  className?: string;
  /** Etiqueta opcional encima de la grilla */
  title?: string;
}

/**
 * Grilla de botones grandes con conteos, pensada para adultos mayores:
 * - tap-target ≥48px, texto grande, etiquetas explícitas (no solo icono)
 * - estados visuales claros (color + borde + check)
 * - aria-pressed para lectores de pantalla
 */
export function VistasRapidas({ items, className, title }: VistasRapidasProps) {
  if (items.length === 0) return null;

  return (
    <section className={className} aria-label={title ?? 'Vistas rápidas'}>
      {title && <h2 className="label-erp mb-3">{title}</h2>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => {
          const tone = TONES[item.tone ?? 'default'];
          const isActive = !!item.active;
          const content = (
            <>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    isActive ? tone.iconActive : tone.icon,
                    isActive ? 'bg-white/15' : 'bg-white'
                  )}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className={cn('text-[15px] font-semibold leading-tight', isActive ? 'text-white' : 'ink')}>
                    {item.label}
                  </p>
                  {item.description && (
                    <p className={cn('mt-0.5 truncate text-xs', isActive ? 'text-white/80' : 'text-secondary')}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              {item.count !== undefined && item.count !== null && (
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums',
                      isActive ? tone.badgeActive : tone.badge
                    )}
                  >
                    {item.count.toLocaleString('es-MX')}
                  </span>
                  {isActive && (
                    <span className="text-xs font-medium uppercase tracking-wider text-white/80">
                      Activa
                    </span>
                  )}
                </div>
              )}
            </>
          );

          const classes = cn(
            'tap-target group flex flex-col rounded-xl border-2 p-4 text-left transition-all',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300',
            isActive ? tone.active + ' shadow-md' : tone.base
          );

          if (item.href) {
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={classes}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              aria-pressed={isActive}
              className={classes}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

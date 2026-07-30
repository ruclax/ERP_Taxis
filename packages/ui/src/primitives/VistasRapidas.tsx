'use client';

import { useState, type ReactNode } from 'react';
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
  /** 'grid' = tarjetas grandes (default); 'bar' = pills compactas */
  variant?: 'grid' | 'bar';
  /** Solo en variant 'bar': cuántas pills mostrar antes del "+N más". Default 5. */
  maxVisible?: number;
}

/**
 * Grilla de botones grandes con conteos, pensada para adultos mayores:
 * - tap-target ≥48px, texto grande, etiquetas explícitas (no solo icono)
 * - estados visuales claros (color + borde + check)
 * - aria-pressed para lectores de pantalla
 */
export function VistasRapidas({ items, className, title, variant = 'grid', maxVisible = 5 }: VistasRapidasProps) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;

  // Variante compacta: pills que envuelven; los menos usados se colapsan tras "+N más".
  if (variant === 'bar') {
    const hayMas = items.length > maxVisible;
    // Colapsado: primeras `maxVisible` + cualquier activa oculta (para no perder el estado)
    const shown = !expanded && hayMas
      ? [...items.slice(0, maxVisible), ...items.slice(maxVisible).filter((i) => i.active)]
      : items;

    return (
      <section className={className} aria-label={title ?? 'Vistas rápidas'}>
        <div className="flex flex-wrap gap-2">
          {shown.map((item) => {
            const tone = TONES[item.tone ?? 'default'];
            const isActive = !!item.active;
            const classes = cn(
              'inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300',
              isActive ? tone.active : tone.base
            );
            const inner = (
              <>
                <span className={cn('flex shrink-0 items-center [&_svg]:h-4 [&_svg]:w-4', isActive ? tone.iconActive : tone.icon)} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={isActive ? 'text-white' : 'ink'}>{item.label}</span>
                {item.count !== undefined && item.count !== null && (
                  <span className={cn(
                    'inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums',
                    isActive ? tone.badgeActive : tone.badge
                  )}>
                    {item.count.toLocaleString('es-MX')}
                  </span>
                )}
              </>
            );
            return item.href ? (
              <a key={item.id} href={item.href} aria-current={isActive ? 'page' : undefined} className={classes}>{inner}</a>
            ) : (
              <button key={item.id} type="button" onClick={item.onClick} aria-pressed={isActive} className={classes}>{inner}</button>
            );
          })}

          {hayMas && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              {expanded ? 'Ver menos' : `+${items.length - maxVisible} más`}
            </button>
          )}
        </div>
      </section>
    );
  }

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

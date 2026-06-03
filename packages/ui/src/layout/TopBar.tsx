import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface TopBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onMenuClick?: () => void;
  search?: ReactNode;
  actions?: ReactNode;
  rolBadge?: ReactNode;
  className?: string;
}

export function TopBar({
  title,
  subtitle,
  breadcrumbs,
  onMenuClick,
  search,
  actions,
  rolBadge,
  className,
}: TopBarProps) {
  return (
    <header className={cn('sticky top-0 z-30 border-b border-slate-200 bg-white', className)}>
      <div className="px-4 pt-4 pb-4 sm:px-6 sm:pt-5 lg:px-10 lg:pt-6 lg:pb-5">
        <div className="flex items-start gap-3 sm:gap-6">
          {/* Hamburguesa solo mobile/tablet */}
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Abrir menú"
              className="-ml-2 mt-1 shrink-0 rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          {/* Título + breadcrumbs */}
          <div className="min-w-0 flex-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="mb-2 hidden flex-wrap items-center gap-2 text-[13px] text-slate-500 sm:flex">
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-slate-300">›</span>}
                    {b.href ? (
                      <a href={b.href} className="hover:text-slate-700">{b.label}</a>
                    ) : (
                      <span className={i === breadcrumbs.length - 1 ? 'font-medium text-slate-700' : ''}>{b.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <h1 className="ink truncate text-[22px] font-bold leading-tight tracking-tight sm:text-[26px] lg:text-[28px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 hidden truncate text-[14px] text-slate-500 sm:block sm:text-[15px]">
                {subtitle}
              </p>
            )}
          </div>

          {search && <div className="hidden md:block min-w-0">{search}</div>}

          {(actions || rolBadge) && (
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {actions}
              {rolBadge}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

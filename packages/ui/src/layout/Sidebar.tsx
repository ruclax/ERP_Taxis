'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../cn';

// ─────────────────────────────────────────────────────────────
// Sidebar — compound component
// Patrón: <Sidebar><Sidebar.Brand/><Sidebar.Group>...<Sidebar.Item/></Sidebar.Group><Sidebar.Footer/></Sidebar>
//
// Principios de diseño aplicados:
//   1. Touch target 44px+ (cumple Apple HIG)
//   2. Estados visuales bien diferenciados (default, hover, active, focus)
//   3. Navegación nativa (consumer pasa un `<Link>` o `<a>` real)
//   4. Identidad consistente (brand fija arriba con barra roja superior)
//   5. Accesibilidad WCAG AA (focus trap, aria-current, aria-expanded)
//   6. Agrupación por dominio (sección con etiqueta opcional)
//   7. Responsive: drawer < md, docked sticky h-full ≥ md
//   8. Footer en 2 zonas semánticas: identidad + acciones
// ─────────────────────────────────────────────────────────────

export interface SidebarRootProps {
  /** Etiqueta accesible del aside */
  label?: string;
  /** Modo móvil: drawer abierto */
  open?: boolean;
  /** Cierra el drawer (mobile) */
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Root del sidebar — gestiona el drawer en móvil y el focus trap.
 * En desktop (≥ md) es un bloque docked en el AppShell flex container.
 */
export function Sidebar({ label = 'Navegación principal', open, onClose, children, className }: SidebarRootProps) {
  const asideRef = useRef<HTMLElement>(null);

  // Focus trap simple para el drawer móvil
  useEffect(() => {
    if (!open) return;

    const aside = asideRef.current;
    if (!aside) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !aside) return;
      const focusables = aside.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    // Auto-focus al primer elemento al abrir el drawer
    const first = aside.querySelector<HTMLElement>('a[href], button:not([disabled])');
    first?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop SOLO en móvil cuando drawer está abierto */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 md:hidden"
        />
      )}
      <aside
        ref={asideRef}
        aria-label={label}
        aria-modal={open ? true : undefined}
        role={open ? 'dialog' : undefined}
        className={cn(
          // Layout común
          'flex flex-col border-r border-slate-800 bg-(--ink) text-slate-200',
          // Móvil: drawer fijo overlay
          'fixed inset-y-0 left-0 z-50 w-[300px] transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          // Desktop: docked en flex, altura del padre
          'md:relative md:inset-auto md:z-auto md:h-full md:w-[260px] md:shrink-0 md:translate-x-0 md:transition-none',
          className
        )}
      >
        {children}
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar.Brand — bloque de identidad (logo + nombre + subtítulo)
// ─────────────────────────────────────────────────────────────

export interface SidebarBrandProps {
  /** Texto del logo (ej. "TX"). Si pasas `logoUrl`, esto es fallback */
  logoText?: string;
  /** URL del logo (PNG/SVG) — opcional, sobreescribe logoText */
  logoUrl?: string;
  /** Nombre principal (ej. "Taxi ERP") */
  name: string;
  /** Subtítulo opcional (ej. "Sindicato Nvo. Laredo") */
  subtitle?: string;
  /** Click en móvil para cerrar drawer */
  onClose?: () => void;
}

function Brand({ logoText = 'TX', logoUrl, name, subtitle, onClose }: SidebarBrandProps) {
  return (
    <div className="relative shrink-0 border-b border-slate-800 px-5 py-5">
      {/* Banda roja superior — identidad visual del prototipo */}
      <div className="absolute left-0 top-0 h-1 w-full bg-red-700" aria-hidden="true" />
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-red-700 text-xl font-bold tracking-tight text-white"
          >
            {logoText}
          </div>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-base font-bold text-white">{name}</div>
          {subtitle && (
            <div className="truncate text-[11px] uppercase tracking-wider text-slate-400">
              {subtitle}
            </div>
          )}
        </div>
        {/* Botón cerrar — solo en móvil cuando hay onClose */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar.Nav — contenedor scrollable de grupos
// ─────────────────────────────────────────────────────────────

function Nav({ children }: { children: ReactNode }) {
  return (
    <nav className="flex-1 overflow-y-auto py-3" aria-label="Módulos">
      {children}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar.Group — sección de items con etiqueta opcional
// ─────────────────────────────────────────────────────────────

export interface SidebarGroupProps {
  label?: string;
  children: ReactNode;
}

function Group({ label, children }: SidebarGroupProps) {
  return (
    <div className="mb-2 last:mb-0">
      {label && (
        <div className="px-5 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </div>
      )}
      <ul className="space-y-px" role="list">
        {children}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar.Item — entrada de navegación (Link recomendado)
// ─────────────────────────────────────────────────────────────

export interface SidebarItemProps {
  /** ¿Está activo? (matchea ruta actual) */
  active?: boolean;
  /** Ícono lucide u otro */
  icon?: ReactNode;
  /** Etiqueta visible (requerida si no usas asChild) */
  label?: string;
  /** Indicador numérico (notificaciones, pendientes) */
  badge?: string | number;
  /** Marca como "Solo lectura" */
  readOnly?: boolean;
  /** href si es link (usar next/link como wrapper) — si no se pasa, render button */
  href?: string;
  /** onClick para variante botón o cerrar drawer al navegar */
  onClick?: () => void;
  /** Render-as: permite que el consumer pase su propio <Link> con Sidebar.ItemContent adentro */
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * Visual del item — reusable dentro de un Link, button, o cualquier elemento
 * que el consumer use (next/link, react-router Link, etc.)
 */
export interface SidebarItemContentProps {
  active?: boolean;
  icon?: ReactNode;
  label: string;
  badge?: string | number;
  readOnly?: boolean;
}

function ItemContent({ active, icon, label, badge, readOnly }: SidebarItemContentProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-5 py-3 text-[15px] outline-none transition-colors min-h-[44px]',
        active
          ? 'bg-slate-800/80 text-white'
          : 'text-slate-300 hover:bg-slate-800/40 hover:text-white',
        'focus-visible:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-inset'
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-red-600"
        />
      )}
      {icon && (
        <span className={cn('shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')}>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate font-medium">{label}</span>
      {readOnly && (
        <span
          title="Solo lectura"
          aria-label="Solo lectura"
          className="shrink-0 rounded bg-slate-700/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-300"
        >
          RO
        </span>
      )}
      {badge !== undefined && badge !== null && badge !== '' && (
        <span
          aria-label={`${badge} pendientes`}
          className="shrink-0 rounded-full bg-red-700 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px] text-center"
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function Item({ active, icon, label, badge, readOnly, href, onClick, asChild, children }: SidebarItemProps) {
  // Modo "asChild": el padre pasa su propio Link / wrapper
  if (asChild && children) {
    return <li>{children}</li>;
  }

  if (!label) {
    throw new Error('Sidebar.Item requires `label` when not using asChild');
  }

  const content = (
    <ItemContent active={active} icon={icon} label={label} badge={badge} readOnly={readOnly} />
  );

  return (
    <li>
      {href ? (
        <a
          href={href}
          onClick={onClick}
          className="block focus:outline-none"
          aria-current={active ? 'page' : undefined}
        >
          {content}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="block w-full text-left focus:outline-none"
          aria-current={active ? 'page' : undefined}
        >
          {content}
        </button>
      )}
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar.Footer — bloque inferior (persona + acciones)
// ─────────────────────────────────────────────────────────────

export interface SidebarFooterProps {
  children: ReactNode;
}

function Footer({ children }: SidebarFooterProps) {
  return <div className="shrink-0 border-t border-slate-800">{children}</div>;
}

// ─────────────────────────────────────────────────────────────
// Sidebar.UserBlock — bloque de identidad del usuario (composición del Footer)
// ─────────────────────────────────────────────────────────────

export interface SidebarUserBlockProps {
  name: string;
  subtitle?: string;
  avatarText?: string;
  avatarColor?: string;
}

function UserBlock({ name, subtitle, avatarText, avatarColor = '#475569' }: SidebarUserBlockProps) {
  const initials = avatarText ?? name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
        style={{ background: avatarColor }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-semibold text-white">{name}</div>
        {subtitle && <div className="truncate text-[11px] text-slate-400">{subtitle}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar.Action — botón de acción en el footer (logout, settings, etc.)
// ─────────────────────────────────────────────────────────────

export interface SidebarActionProps {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: 'default' | 'accent';
}

function Action({ icon, label, onClick, href, tone = 'default' }: SidebarActionProps) {
  const inner = (
    <div
      className={cn(
        'flex items-center gap-2 px-5 py-2.5 text-sm transition-colors min-h-[40px]',
        tone === 'accent'
          ? 'text-amber-400 hover:bg-slate-800/60 hover:text-amber-300'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
        'focus-visible:bg-slate-800/60 focus-visible:outline-none'
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1">{label}</span>
    </div>
  );
  return href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="block">
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Exports del compound component
// ─────────────────────────────────────────────────────────────

Sidebar.Brand = Brand;
Sidebar.Nav = Nav;
Sidebar.Group = Group;
Sidebar.Item = Item;
Sidebar.ItemContent = ItemContent;
Sidebar.Footer = Footer;
Sidebar.UserBlock = UserBlock;
Sidebar.Action = Action;

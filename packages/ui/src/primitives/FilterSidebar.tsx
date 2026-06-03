'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '../cn';

export interface FilterOption {
  value: string;
  label: string;
  /** Conteo opcional para mostrar al lado del checkbox */
  count?: number | null;
  /** Descripción breve adicional para usuarios mayores */
  hint?: string;
}

export interface FilterGroup {
  id: string;
  /** Etiqueta visible del grupo (ej. "Estatus del socio") */
  label: string;
  /** Tipo de input: checkboxes (multi) o radio (uno) */
  type?: 'checkbox' | 'radio';
  /** Opciones del grupo */
  options: FilterOption[];
  /** Valores seleccionados actualmente (multi) o el único valor (radio) */
  value: string[] | string | null;
  /** Callback cuando cambia la selección */
  onChange: (next: string[] | string | null) => void;
  /** Icono opcional al lado de la etiqueta del grupo */
  icon?: ReactNode;
  /** Comienza colapsado */
  defaultCollapsed?: boolean;
}

export interface FilterSidebarProps {
  groups: FilterGroup[];
  /** Botón para limpiar todos los filtros */
  onClearAll?: () => void;
  /** Total de filtros activos (para el badge "Limpiar X filtros") */
  activeCount?: number;
  className?: string;
}

/**
 * Panel lateral siempre visible con grupos de filtros plegables.
 * Diseñado para adultos mayores:
 * - Checkboxes de 20px (grandes), labels grandes, tap-target ≥48px
 * - Cada opción es un label entero clickeable (mayor área de tap)
 * - Conteo entre paréntesis ayuda a anticipar resultados
 */
export function FilterSidebar({ groups, onClearAll, activeCount = 0, className }: FilterSidebarProps) {
  return (
    <aside
      className={cn('flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4', className)}
      aria-label="Filtros avanzados"
    >
      <div className="flex items-center justify-between gap-2 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Filtros</h2>
        {activeCount > 0 && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="tap-target rounded-md px-2.5 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Limpiar {activeCount} {activeCount === 1 ? 'filtro' : 'filtros'}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {groups.map((g) => (
          <FilterGroupBlock key={g.id} group={g} />
        ))}
      </div>
    </aside>
  );
}

function FilterGroupBlock({ group }: { group: FilterGroup }) {
  const [open, setOpen] = useState(!group.defaultCollapsed);
  const isMulti = (group.type ?? 'checkbox') === 'checkbox';
  const selected: string[] = isMulti ? ((group.value as string[]) ?? []) : [];
  const radioVal = !isMulti ? (group.value as string | null) : null;

  function toggleCheckbox(val: string) {
    if (!isMulti) return;
    const set = new Set(selected);
    if (set.has(val)) set.delete(val); else set.add(val);
    group.onChange(Array.from(set));
  }

  function selectRadio(val: string) {
    if (isMulti) return;
    group.onChange(radioVal === val ? null : val);
  }

  const activeInGroup = isMulti ? selected.length : radioVal ? 1 : 0;

  return (
    <div className="rounded-lg border border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="tap-target flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <span className="flex items-center gap-2">
          {group.icon && <span className="text-slate-500" aria-hidden="true">{group.icon}</span>}
          <span className="text-[15px] font-semibold ink">{group.label}</span>
          {activeInGroup > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
              {activeInGroup}
            </span>
          )}
        </span>
        <svg
          className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
        </svg>
      </button>

      {open && (
        <ul className="flex flex-col gap-0.5 px-1 pb-2" role={isMulti ? 'group' : 'radiogroup'} aria-label={group.label}>
          {group.options.map((opt) => {
            const checked = isMulti
              ? selected.includes(opt.value)
              : radioVal === opt.value;
            return (
              <li key={opt.value}>
                <label
                  className={cn(
                    'tap-target flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-50',
                    checked && 'bg-blue-50/60'
                  )}
                >
                  <input
                    type={isMulti ? 'checkbox' : 'radio'}
                    name={group.id}
                    value={opt.value}
                    checked={checked}
                    onChange={() => isMulti ? toggleCheckbox(opt.value) : selectRadio(opt.value)}
                    className="h-5 w-5 cursor-pointer accent-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-[15px]', checked ? 'font-semibold ink' : 'text-slate-800')}>
                      {opt.label}
                    </span>
                    {opt.hint && (
                      <span className="block text-xs text-secondary">{opt.hint}</span>
                    )}
                  </span>
                  {opt.count !== undefined && opt.count !== null && (
                    <span className="text-sm tabular-nums text-slate-500">
                      {opt.count.toLocaleString('es-MX')}
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

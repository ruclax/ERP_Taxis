'use client';

import { useEffect, useRef, useState, useId } from 'react';
import { Search, X, Loader2, Clock } from 'lucide-react';
import { cn } from '../cn';

export interface SearchBoxOption {
  id: string;
  label: string;
  /** Texto secundario (subtítulo bajo el label) */
  sublabel?: string;
  /** Categoría / etiqueta tipo "Concesión", "Placas" */
  badge?: string;
  /** Valor que se setea como query al elegir esta opción */
  value: string;
  /** href opcional: si se pasa, al click navega ahí (sin setear query) */
  href?: string;
}

export interface SearchBoxProps {
  /** Valor controlado del input */
  value: string;
  /** onChange del input */
  onChange: (v: string) => void;
  /** Llamado al elegir una opción (autocompletado o reciente) */
  onSelect?: (opt: SearchBoxOption) => void;
  /** Opciones de autocompletado en vivo (consumer decide qué mostrar) */
  options?: SearchBoxOption[];
  /** Búsquedas recientes (consumer las maneja con localStorage) */
  recents?: string[];
  /** Llamado al limpiar el input (X o Esc) */
  onClear?: () => void;
  /** Llamado al confirmar la búsqueda con Enter (sin elegir opción) */
  onSubmit?: () => void;
  /** Llamado al quitar una búsqueda reciente */
  onRemoveRecent?: (q: string) => void;
  /** Spinner a la derecha del input */
  loading?: boolean;
  /** Etiqueta del label superior */
  label?: string;
  /** Placeholder del input */
  placeholder?: string;
  /** Texto bajo el input (hint o tipo detectado) */
  hint?: string;
  /** Atajo de teclado a mostrar */
  shortcut?: string;
  className?: string;
}

/**
 * SearchBox: input + dropdown de autocompletado/recientes con navegación de teclado.
 * - ↓/↑: navega entre opciones
 * - Enter: selecciona la enfocada o ejecuta onSubmit
 * - Esc: cierra dropdown o limpia input
 * - Cmd/Ctrl+K: enfoca (gestionado por el consumer)
 */
export function SearchBox({
  value, onChange, onSelect, options = [], recents = [],
  onClear, onSubmit, onRemoveRecent,
  loading, label, placeholder = 'Buscar…', hint, shortcut = 'Ctrl+K',
  className,
}: SearchBoxProps) {
  const id = useId();
  const inputId = `sb-${id}`;
  const listId = `sb-list-${id}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);

  // Decide qué mostrar en dropdown
  const showOptions = open && (value.length >= 2 ? options : []);
  const showRecents = open && value.length === 0 && recents.length > 0;
  const items: Array<{ type: 'option'; opt: SearchBoxOption } | { type: 'recent'; q: string }> = [
    ...((showOptions || []).map((o) => ({ type: 'option' as const, opt: o }))),
    ...((showRecents ? recents : []).map((q) => ({ type: 'recent' as const, q }))),
  ];

  // Atajo Cmd/Ctrl+K para enfocar (global)
  useEffect(() => {
    function onShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  // Click fuera cierra
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Reset focus cuando cambian opciones
  useEffect(() => {
    setFocusedIdx(-1);
  }, [value, options.length, recents.length]);

  function selectItem(item: (typeof items)[number]) {
    if (item.type === 'option') {
      onSelect?.(item.opt);
      // Si la opción tiene `value` lo aplicamos al input
      if (item.opt.value !== undefined) onChange(item.opt.value);
    } else {
      onChange(item.q);
      // Re-submit con la query reciente
      onSubmit?.();
    }
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      if (value) {
        onClear?.();
        onChange('');
      } else {
        setOpen(false);
        e.currentTarget.blur();
      }
      return;
    }
    if (e.key === 'Enter') {
      if (focusedIdx >= 0 && items[focusedIdx]) {
        e.preventDefault();
        selectItem(items[focusedIdx]);
      } else {
        onSubmit?.();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        setOpen(true);
        setFocusedIdx((i) => Math.min(i + 1, items.length - 1));
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, -1));
      return;
    }
  }

  const showClear = !!onClear && value.length > 0 && !loading;

  return (
    <div ref={containerRef} className={cn('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="label-erp">{label}</label>
      )}

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={focusedIdx >= 0 ? `${listId}-${focusedIdx}` : undefined}
          aria-autocomplete="list"
          value={value}
          placeholder={placeholder}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={cn(
            'block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-[15px] text-slate-900 placeholder:text-slate-400',
            'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200',
            // Quita el botón X nativo de algunos navegadores (Edge, Chrome) en type=search
            '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden'
          )}
        />
        {loading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Loader2 size={16} className="animate-spin" />
          </span>
        )}
        {showClear && (
          <button
            type="button"
            onClick={() => { onClear?.(); onChange(''); inputRef.current?.focus(); }}
            aria-label="Limpiar"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Hint debajo del input */}
      {hint && !open && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
      {!hint && !open && (
        <p className="text-xs text-slate-500">Tip: <kbd className="rounded border border-slate-300 bg-slate-100 px-1 text-[10px] font-semibold">{shortcut}</kbd> para enfocar</p>
      )}

      {/* Dropdown */}
      {open && items.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {showRecents && (
            <li className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500">
              Búsquedas recientes
            </li>
          )}
          {items.map((item, idx) => {
            const isFocused = idx === focusedIdx;
            const baseCls = cn(
              'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
              isFocused ? 'bg-slate-100' : 'hover:bg-slate-50'
            );
            if (item.type === 'recent') {
              return (
                <li key={`r-${idx}`} id={`${listId}-${idx}`} role="option" aria-selected={isFocused}>
                  <div className="group flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setFocusedIdx(idx)}
                      className={cn(baseCls, 'flex-1')}
                    >
                      <Clock size={14} className="text-slate-400" />
                      <span className="flex-1 truncate text-slate-700">{item.q}</span>
                    </button>
                    {onRemoveRecent && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemoveRecent(item.q); }}
                        aria-label={`Quitar "${item.q}" de recientes`}
                        className="mr-2 rounded p-1 text-slate-400 opacity-0 hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </li>
              );
            }
            const opt = item.opt;
            return (
              <li key={`o-${opt.id}-${idx}`} id={`${listId}-${idx}`} role="option" aria-selected={isFocused}>
                <button
                  type="button"
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setFocusedIdx(idx)}
                  className={cn(baseCls, 'w-full')}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="truncate text-xs text-slate-500">{opt.sublabel}</div>
                    )}
                  </div>
                  {opt.badge && (
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                      {opt.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

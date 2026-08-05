import { Fragment, type ReactNode, type KeyboardEvent } from 'react';
import { cn } from '../cn';

export interface ColumnDef<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  hideOn?: 'sm' | 'md' | 'lg';  // breakpoint hasta el cual se oculta (vista tabla)
  /** En la vista de tarjeta (móvil), esta columna es el título. Por defecto la primera. */
  primary?: boolean;
  /** Ocultar esta columna en la vista de tarjeta (móvil). */
  hideOnCard?: boolean;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  loading?: boolean;
}

const HIDE_CLS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

const ALIGN_CLS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function DataTable<T>({ rows, columns, rowKey, onRowClick, empty, loading }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
        Cargando…
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
        {empty ?? 'Sin resultados'}
      </div>
    );
  }

  const clickable = Boolean(onRowClick);
  const activate = (row: T) => (e: KeyboardEvent) => {
    if (!onRowClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(row);
    }
  };

  // Columnas visibles en la tarjeta móvil (respeta hideOnCard)
  const cardCols = columns.filter((c) => !c.hideOnCard);
  const primaryCol = cardCols.find((c) => c.primary) ?? cardCols[0];
  const secondaryCols = cardCols.filter((c) => c !== primaryCol);

  return (
    <>
      {/* ≥ sm — tabla clásica con scroll horizontal en su propia caja */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white sm:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'label-erp px-4 py-3',
                    ALIGN_CLS[c.align ?? 'left'],
                    c.hideOn && HIDE_CLS[c.hideOn],
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={clickable ? activate(row) : undefined}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                className={cn(
                  'transition-colors',
                  clickable &&
                    'cursor-pointer hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/50'
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-4 py-3 text-slate-700',
                      ALIGN_CLS[c.align ?? 'left'],
                      c.hideOn && HIDE_CLS[c.hideOn],
                      c.className
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* < sm — tarjetas apiladas (más nativo en móvil que el scroll horizontal) */}
      <ul className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)}>
            <div
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={clickable ? activate(row) : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              className={cn(
                'rounded-xl border border-slate-200 bg-white p-4',
                clickable &&
                  'cursor-pointer transition-colors active:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50'
              )}
            >
              {primaryCol && (
                <div className="mb-2 border-b border-slate-100 pb-2 text-base font-semibold text-slate-800">
                  {primaryCol.cell(row)}
                </div>
              )}
              <dl className="divide-y divide-slate-50">
                {secondaryCols.map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3 py-1.5">
                    <dt className="label-erp shrink-0 text-slate-500">{c.header}</dt>
                    <dd className="min-w-0 text-right text-slate-700">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

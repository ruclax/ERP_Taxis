'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@erp/ui/primitives';
import { ChevronDown, RefreshCw, Upload, UserPlus, Car } from 'lucide-react';

/**
 * Menú de acciones rápidas del expediente. Cada acción hace deep-link a la
 * pestaña correspondiente y (cuando aplica) pasa `?do=` para que el panel
 * destino abra su modal automáticamente.
 */
export default function AccionesMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function go(tab: string, doParam?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'general') params.delete('tab');
    else params.set('tab', tab);
    if (doParam) params.set('do', doParam);
    else params.delete('do');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setOpen(false);
  }

  const items = [
    { label: 'Cambiar estatus', icon: <RefreshCw size={15} />, on: () => go('general', 'estatus') },
    { label: 'Subir documento', icon: <Upload size={15} />, on: () => go('documentos') },
    { label: 'Agregar beneficiario', icon: <UserPlus size={15} />, on: () => go('beneficiarios', 'beneficiario') },
    { label: 'Concesiones y flota', icon: <Car size={15} />, on: () => go('concesiones') },
  ];

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        iconRight={<ChevronDown size={14} />}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Acciones
      </Button>
      {open && (
        <>
          <button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} className="fixed inset-0 z-30" />
          <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
            {items.map((it) => (
              <button
                key={it.label}
                role="menuitem"
                type="button"
                onClick={it.on}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className="text-slate-400">{it.icon}</span> {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@erp/ui/primitives';

const TAB_KEYS = ['general', 'concesiones', 'documentos', 'beneficiarios', 'identificaciones'] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default function ExpedienteTabs({
  general,
  concesiones,
  documentos,
  beneficiarios,
  identificaciones,
  counts,
}: {
  general: ReactNode;
  concesiones: ReactNode;
  documentos: ReactNode;
  beneficiarios: ReactNode;
  identificaciones: ReactNode;
  counts?: { concesiones?: number; documentos?: number; beneficiarios?: number };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab') as TabKey | null;
  // La URL es la fuente de verdad de la pestaña activa (deep-link + navegación externa).
  const tab: TabKey = urlTab && TAB_KEYS.includes(urlTab) ? urlTab : 'general';

  function cambiar(next: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'general') params.delete('tab');
    else params.set('tab', next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const panels: Record<TabKey, ReactNode> = {
    general,
    concesiones,
    documentos,
    beneficiarios,
    identificaciones,
  };

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        value={tab}
        onChange={cambiar}
        scrollable
        options={[
          { value: 'general', label: 'General' },
          { value: 'concesiones', label: 'Concesiones y flota', count: counts?.concesiones },
          { value: 'documentos', label: 'Documentos', count: counts?.documentos },
          { value: 'beneficiarios', label: 'Beneficiarios', count: counts?.beneficiarios },
          { value: 'identificaciones', label: 'Identificaciones' },
        ]}
      />
      <div className="flex flex-col gap-5">{panels[tab]}</div>
    </div>
  );
}

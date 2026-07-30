'use client';

import { useState, type ReactNode } from 'react';
import { Tabs } from '@erp/ui/primitives';

type TabKey = 'general' | 'concesiones' | 'documentos' | 'beneficiarios' | 'identificaciones';

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
  const [tab, setTab] = useState<TabKey>('general');
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
        onChange={setTab}
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

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Badge, Button } from '@erp/ui/primitives';
import { DataTable } from '@erp/ui/data';
import { MapPin, Search } from 'lucide-react';
import type { SitioListado } from '@erp/db/queries/sitios';

export default function SitiosView({ sitios }: { sitios: SitioListado[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [sinDeleg, setSinDeleg] = useState(false);

  const sinDelegCount = useMemo(() => sitios.filter((s) => !s.delegado_socio_id).length, [sitios]);

  const filtered = useMemo(
    () =>
      sitios.filter(
        (s) =>
          (!q.trim() || s.nombre.toLowerCase().includes(q.trim().toLowerCase())) &&
          (!sinDeleg || !s.delegado_socio_id)
      ),
    [sitios, q, sinDeleg]
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold ink">Sitios</h1>
        <p className="text-sm text-slate-500">
          {sitios.length} sitios · {sinDelegCount} sin delegado
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            label="Buscar sitio"
            placeholder="Nombre del sitio…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            iconLeft={<Search size={16} />}
          />
        </div>
        <Button variant={sinDeleg ? 'primary' : 'secondary'} size="sm" onClick={() => setSinDeleg((v) => !v)}>
          Sin delegado ({sinDelegCount})
        </Button>
      </div>

      <DataTable
        rows={filtered}
        rowKey={(s) => s.id}
        onRowClick={(s) => router.push(`/sitios/${s.id}`)}
        empty="Sin sitios que coincidan"
        columns={[
          {
            key: 'nombre',
            header: 'Sitio',
            cell: (s) => (
              <div className="flex min-w-0 items-center gap-2">
                <MapPin size={16} className="shrink-0 text-slate-400" />
                <span className="truncate font-medium ink">{s.nombre}</span>
              </div>
            ),
          },
          {
            key: 'delegado',
            header: 'Delegado',
            cell: (s) =>
              s.delegado_nombre ? (
                <span className="text-sm text-slate-700">{s.delegado_nombre}</span>
              ) : (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">Sin delegado</span>
              ),
          },
          {
            key: 'conc',
            header: 'Concesiones',
            align: 'right',
            hideOn: 'sm',
            cell: (s) => <span className="mono tabular-nums text-slate-700">{s.concesiones}</span>,
          },
          {
            key: 'activo',
            header: 'Estado',
            cell: (s) => <Badge tone={s.activo ? 'success' : 'warn'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>,
          },
        ]}
      />
    </div>
  );
}

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@erp/db/client/server';
import { obtenerSitio } from '@erp/db/queries/sitios';
import { Card, CardBody, CardHeader, Badge } from '@erp/ui/primitives';
import { ConcesionEstadoPill } from '@erp/ui/data';
import { ChevronRight, MapPin } from 'lucide-react';
import SitioDatosCard, { type SitioEditable } from './_components/SitioDatosCard';
import DelegadoCard from './_components/DelegadoCard';

function pickOne(v: unknown): Record<string, unknown> | null {
  if (Array.isArray(v)) return (v[0] as Record<string, unknown>) ?? null;
  if (v && typeof v === 'object') return v as Record<string, unknown>;
  return null;
}

export default async function SitioDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServer(await cookies());

  let sitio: Record<string, unknown> | null = null;
  try {
    sitio = (await obtenerSitio(supabase, id)) as unknown as Record<string, unknown>;
  } catch {
    notFound();
  }
  if (!sitio) notFound();

  const delegado = pickOne(sitio.delegado);
  const concesiones = (sitio.concesiones as Array<Record<string, unknown>> | null) ?? [];

  const editable: SitioEditable = {
    nombre: (sitio.nombre as string) ?? '',
    direccion: (sitio.direccion as string | null) ?? null,
    telefono: (sitio.telefono as string | null) ?? null,
    area_num: (sitio.area_num as number | null) ?? null,
    notas: (sitio.notas as string | null) ?? null,
    activo: Boolean(sitio.activo),
  };

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/sitios" className="hover:text-slate-700">Sitios</Link>
        <ChevronRight size={14} className="text-slate-400" />
        <span className="truncate font-medium text-slate-700">{editable.nombre}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <MapPin size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold ink">{editable.nombre}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{concesiones.length} concesión(es)</span>
            <Badge tone={editable.activo ? 'success' : 'warn'}>{editable.activo ? 'Activo' : 'Inactivo'}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Datos del sitio" />
          <CardBody>
            <SitioDatosCard sitioId={id} sitio={editable} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Delegado" subtitle="Responsable del sitio." />
          <CardBody>
            <DelegadoCard
              sitioId={id}
              delegadoNombre={(delegado?.nombre_completo as string | null) ?? null}
              delegadoCodigo={(delegado?.codigo_agremiado as string | null) ?? null}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Concesiones del sitio"
          subtitle={`${concesiones.length} concesión(es) adscritas a este sitio.`}
        />
        <CardBody>
          {concesiones.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Sin concesiones en este sitio.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {concesiones.map((c) => {
                const titular = pickOne(c.socios);
                const veh = pickOne(c.vehiculos);
                return (
                  <li key={c.id as string} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <span className="mono font-medium text-slate-800">{c.numero_concesion as string}</span>
                    {c.taxi_numero != null && <span className="text-xs text-slate-500">Taxi {c.taxi_numero as number}</span>}
                    <ConcesionEstadoPill estado={c.estado as string} />
                    {titular && (
                      <Link href={`/padron/${titular.id as string}`} className="text-sm text-blue-700 hover:underline">
                        {titular.nombre_completo as string}
                      </Link>
                    )}
                    {veh && (
                      <Link href={`/flota/${veh.id as string}`} className="mono ml-auto text-xs text-slate-500 hover:text-slate-700">
                        {(veh.placas as string | null) ?? 'unidad'} →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

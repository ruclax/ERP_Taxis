import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@erp/db/client/server';
import { obtenerVehiculo } from '@erp/db/queries/vehiculos';
import { listarDocumentos } from '@erp/db/queries/documentos';
import { Card, CardBody, CardHeader, Badge } from '@erp/ui/primitives';
import { ChevronRight, User, Printer } from 'lucide-react';
import VehiculoPolizaPanel, { type Vehiculo, type Poliza } from '../../padron/[id]/_components/VehiculoPolizaPanel';
import ChoferesPanel from '../../padron/[id]/_components/ChoferesPanel';
import DocumentosPanel from '../../padron/[id]/_components/DocumentosPanel';

function pickOne(v: unknown): Record<string, unknown> | null {
  if (Array.isArray(v)) return (v[0] as Record<string, unknown>) ?? null;
  if (v && typeof v === 'object') return v as Record<string, unknown>;
  return null;
}

export default async function VehiculoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServer(await cookies());

  let veh: Record<string, unknown> | null = null;
  try {
    veh = (await obtenerVehiculo(supabase, id)) as unknown as Record<string, unknown>;
  } catch {
    notFound();
  }
  if (!veh) notFound();

  const conc = pickOne(veh.concesiones);
  const titular = conc ? pickOne(conc.socios) : null;
  const concesionId = (conc?.id as string) ?? '';
  const titularId = (titular?.id as string) ?? '';

  const polizasArr = (((veh.polizas as Array<Record<string, unknown>>) ?? []).slice()).sort(
    (a, b) => String(b.fecha_vencimiento ?? '').localeCompare(String(a.fecha_vencimiento ?? ''))
  );
  const polRow = polizasArr[0] ?? null;

  const vehiculo: Vehiculo = {
    id: veh.id as string,
    placas: (veh.placas as string | null) ?? null,
    numero_serie: (veh.numero_serie as string | null) ?? null,
    marca: (veh.marca as string | null) ?? null,
    modelo: (veh.modelo as string | null) ?? null,
    anio: (veh.anio as number | null) ?? null,
    color: (veh.color as string | null) ?? null,
    engomado: (veh.engomado as string | null) ?? null,
    estatus: (veh.estatus as Vehiculo['estatus']) ?? 'ACTIVO',
    comentarios: (veh.comentarios as string | null) ?? null,
  };

  const poliza: Poliza | null = polRow
    ? {
        id: polRow.id as string,
        numero_poliza: (polRow.numero_poliza as string) ?? '',
        compania: (polRow.compania as string) ?? '',
        costo: (polRow.costo as number | null) ?? null,
        fecha_inicio: (polRow.fecha_inicio as string | null) ?? null,
        fecha_vencimiento: (polRow.fecha_vencimiento as string) ?? '',
        endoso: (polRow.endoso as string | null) ?? null,
        estado: (polRow.estado as string) ?? '',
        comentarios: (polRow.comentarios as string | null) ?? null,
      }
    : null;

  let vehDocs: Awaited<ReturnType<typeof listarDocumentos>> = [];
  let polDocs: Awaited<ReturnType<typeof listarDocumentos>> = [];
  try { vehDocs = await listarDocumentos(supabase, { tipo: 'vehiculo', id }); } catch { vehDocs = []; }
  try { if (poliza) polDocs = await listarDocumentos(supabase, { tipo: 'poliza', id: poliza.id }); } catch { polDocs = []; }

  const placasTxt = vehiculo.placas ?? 'Sin placas';

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/flota" className="hover:text-slate-700">Flota</Link>
        <ChevronRight size={14} className="text-slate-400" />
        <span className="font-medium text-slate-700">{placasTxt}</span>
      </nav>

      {/* Header del vehículo */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="mono text-xl font-bold ink">{placasTxt}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{[vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(' ') || 'Sin datos'}</span>
            {conc && (
              <span className="mono">· {conc.numero_concesion as string}{conc.taxi_numero ? ` · Taxi ${conc.taxi_numero}` : ''}</span>
            )}
            <Badge tone={vehiculo.estatus === 'ACTIVO' ? 'success' : vehiculo.estatus === 'BAJA' ? 'critical' : 'warn'}>
              {vehiculo.estatus}
            </Badge>
          </div>
          {titular && (
            <Link href={`/padron/${titularId}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline">
              <User size={14} /> Titular: {titular.nombre_completo as string}
            </Link>
          )}
        </div>
        <a
          href={`/imprimir/vehiculo/${id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Printer size={15} /> <span className="hidden sm:inline">Imprimir</span>
        </a>
      </div>

      {/* Vehículo y póliza (reusa el panel del expediente) */}
      {concesionId ? (
        <Card>
          <CardHeader title="Vehículo y póliza" />
          <CardBody>
            <VehiculoPolizaPanel
              expedienteSocioId={titularId}
              concesionId={concesionId}
              vehiculo={vehiculo}
              poliza={poliza}
              polizaDocumentos={polDocs}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Este vehículo no está ligado a una concesión.</p>
          </CardBody>
        </Card>
      )}

      {/* Choferes de la unidad */}
      {concesionId && (
        <Card>
          <CardHeader title="Choferes de esta unidad" />
          <CardBody>
            <ChoferesPanel
              concesionId={concesionId}
              taxiNumero={(conc?.taxi_numero as number | null) ?? null}
              numeroConcesion={(conc?.numero_concesion as string) ?? ''}
              expedienteSocioId={titularId}
            />
          </CardBody>
        </Card>
      )}

      {/* Documentos del vehículo */}
      <Card>
        <CardHeader title="Documentos del vehículo" subtitle="Tarjeta de circulación, factura y demás documentos de la unidad." />
        <CardBody>
          <DocumentosPanel owner={{ tipo: 'vehiculo', id }} expedienteSocioId={titularId} documentos={vehDocs} />
        </CardBody>
      </Card>
    </div>
  );
}

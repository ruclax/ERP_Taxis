import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@erp/db/client/server';
import { obtenerVehiculo } from '@erp/db/queries/vehiculos';
import { fmtFechaCorta, fmtMoneda, estadoPolizaVigente } from '@erp/shared/formatters';
import PrintToolbar from '../../../_components/PrintToolbar';

export const dynamic = 'force-dynamic';

function one(v: unknown): Record<string, unknown> | null {
  if (Array.isArray(v)) return (v[0] as Record<string, unknown>) ?? null;
  if (v && typeof v === 'object') return v as Record<string, unknown>;
  return null;
}

export default async function ImprimirVehiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServer(await cookies());

  let veh: Record<string, unknown> | null = null;
  try {
    veh = (await obtenerVehiculo(supabase, id)) as unknown as Record<string, unknown>;
  } catch {
    notFound();
  }
  if (!veh) notFound();

  const conc = one(veh.concesiones);
  const titular = conc ? one(conc.socios) : null;
  const sitio = conc ? one(conc.sitios) : null;
  const pol = one(veh.polizas);
  const estadoPol = pol ? estadoPolizaVigente(pol.fecha_vencimiento as string, pol.estado as string) : null;

  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-[820px] p-4 print:max-w-none print:p-0">
      <PrintToolbar volverHref={`/flota/${id}`} titulo="Ficha del vehículo" />

      <article className="rounded-lg bg-white p-8 text-slate-800 shadow-sm print:rounded-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-2 border-slate-800 pb-3">
          <div>
            <h1 className="text-base font-bold uppercase leading-tight tracking-tight">Sindicato de Choferes de Automóviles de Sitio y Camiones de Pasajeros de Nuevo Laredo</h1>
            <p className="mt-0.5 text-xs text-slate-500">Nuevo Laredo, Tamaulipas</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="font-semibold text-slate-700">FICHA DEL VEHÍCULO</div>
            <div>Impreso: {hoy}</div>
          </div>
        </header>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">
            {[veh.marca, veh.modelo, veh.anio].filter(Boolean).join(' ') || 'Vehículo'}
          </h2>
          <span className="mono text-sm text-slate-600">{(veh.placas as string) ?? 'Sin placas'} · {veh.estatus as string}</span>
        </div>

        <Section title="Datos de la unidad">
          <Field label="Marca" value={veh.marca as string} />
          <Field label="Modelo" value={veh.modelo as string} />
          <Field label="Año" value={veh.anio != null ? String(veh.anio) : undefined} />
          <Field label="Color" value={veh.color as string} />
          <Field label="Placas" value={veh.placas as string} />
          <Field label="No. de serie (VIN)" value={veh.numero_serie as string} />
          <Field label="Engomado" value={veh.engomado as string} />
          <Field label="Estatus" value={veh.estatus as string} />
        </Section>

        <Section title="Concesión y titular">
          <Field label="Concesión" value={conc?.numero_concesion as string} />
          <Field label="Taxi No." value={conc?.taxi_numero != null ? String(conc?.taxi_numero) : undefined} />
          <Field label="Modalidad" value={conc?.modalidad as string} />
          <Field label="Sitio" value={sitio?.nombre as string} />
          <Field label="Titular" value={titular?.nombre_completo as string} full />
        </Section>

        <Section title="Póliza de seguro">
          {pol ? (
            <>
              <Field label="No. de póliza" value={pol.numero_poliza as string} />
              <Field label="Compañía" value={pol.compania as string} />
              <Field label="Estado" value={estadoPol ?? undefined} />
              <Field label="Costo" value={pol.costo != null ? fmtMoneda(pol.costo as number) : undefined} />
              <Field label="Vigencia" value={`${fmtFechaCorta(pol.fecha_inicio as string)} — ${fmtFechaCorta(pol.fecha_vencimiento as string)}`} full />
            </>
          ) : (
            <p className="col-span-2 text-sm text-slate-400">Sin póliza registrada.</p>
          )}
        </Section>

        <div className="mt-10 grid grid-cols-2 gap-10 text-center text-xs text-slate-500">
          <div className="border-t border-slate-400 pt-1">Revisó</div>
          <div className="border-t border-slate-400 pt-1">Sello y firma del sindicato</div>
        </div>
        <p className="mt-6 text-center text-[10px] text-slate-400">
          Documento generado el {hoy} desde la plataforma del Sindicato. Información sujeta a verificación.
        </p>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h3 className="mb-2 border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5">{children}</dl>
    </section>
  );
}

function Field({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={`flex gap-2 text-sm ${full ? 'col-span-2' : ''}`}>
      <dt className="shrink-0 text-slate-500">{label}:</dt>
      <dd className="font-medium text-slate-800">{value || '—'}</dd>
    </div>
  );
}

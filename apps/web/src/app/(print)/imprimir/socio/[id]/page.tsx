import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@erp/db/client/server';
import { obtenerSocio } from '@erp/db/queries/socios';
import { fmtFechaCorta, antiguedadTexto, estadoPolizaVigente } from '@erp/shared/formatters';
import PrintToolbar from '../../../_components/PrintToolbar';

export const dynamic = 'force-dynamic';

function arr(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}
function one(v: unknown): Record<string, unknown> | null {
  if (Array.isArray(v)) return (v[0] as Record<string, unknown>) ?? null;
  if (v && typeof v === 'object') return v as Record<string, unknown>;
  return null;
}

export default async function ImprimirSocioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServer(await cookies());

  let socio: Record<string, unknown> | null = null;
  try {
    socio = (await obtenerSocio(supabase, id)) as unknown as Record<string, unknown>;
  } catch {
    notFound();
  }
  if (!socio) notFound();

  const contactos = arr(socio.socios_contactos);
  const val = (tipo: string) => contactos.find((c) => c.tipo === tipo)?.valor as string | undefined;
  const telCel = val('TEL_CEL');
  const telCasa = val('TEL_CASA');
  const correo = val('CORREO');

  const dirs = arr(socio.socios_direcciones);
  const dir = dirs.find((d) => d.es_actual) ?? dirs[0] ?? null;
  const domicilio = dir
    ? [
        [dir.calle, dir.numero_ext].filter(Boolean).join(' '),
        dir.colonia, dir.ciudad, dir.estado,
        dir.codigo_postal ? `C.P. ${dir.codigo_postal}` : null,
      ].filter(Boolean).join(', ')
    : null;

  const lics = arr(socio.socios_licencia_conducir);
  const lic = lics.find((l) => l.es_actual) ?? lics[0] ?? null;
  const cred = arr(socio.socios_credencial_elector)[0] ?? null;
  const benes = arr(socio.socios_beneficiarios);
  const concs = arr(socio.concesiones);

  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-[820px] p-4 print:max-w-none print:p-0">
      <PrintToolbar volverHref={`/padron/${id}`} titulo="Expediente del agremiado" />

      <article className="rounded-lg bg-white p-8 text-slate-800 shadow-sm print:rounded-none print:p-0 print:shadow-none">
        {/* Encabezado */}
        <header className="flex items-start justify-between gap-4 border-b-2 border-slate-800 pb-3">
          <div>
            <h1 className="text-base font-bold uppercase leading-tight tracking-tight">Sindicato de Choferes de Automóviles de Sitio y Camiones de Pasajeros de Nuevo Laredo</h1>
            <p className="mt-0.5 text-xs text-slate-500">Nuevo Laredo, Tamaulipas</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="font-semibold text-slate-700">EXPEDIENTE DEL AGREMIADO</div>
            <div>Folio: <span className="mono">{socio.codigo_agremiado as string}</span></div>
            <div>Impreso: {hoy}</div>
          </div>
        </header>

        {/* Identidad */}
        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">{socio.nombre_completo as string}</h2>
          <span className="text-sm text-slate-600">
            {(socio.tipo_socio as string) ?? '—'}
            {socio.tipo_escalafon && socio.tipo_escalafon !== 'NINGUNO' ? ` · Escalafón #${socio.escalafon_numero}` : ''}
            {' · '}{socio.estatus as string}
          </span>
        </div>

        <Section title="Datos personales">
          <Field label="RFC" value={socio.rfc as string} />
          <Field label="CURP" value={socio.curp as string} />
          <Field label="Nacimiento" value={fmtFechaCorta(socio.fecha_nacimiento as string)} />
          <Field label="Lugar de nacimiento" value={socio.lugar_nacimiento as string} />
          <Field label="Estado civil" value={socio.estado_civil as string} />
          <Field label="Escolaridad" value={socio.escolaridad as string} />
          <Field label="Ocupación" value={socio.ocupacion as string} />
          <Field label="Fecha de ingreso" value={fmtFechaCorta(socio.fecha_ingreso as string)} />
          <Field label="Antigüedad" value={antiguedadTexto(socio.fecha_ingreso as string)} />
          <Field label="Turno" value={socio.turno as string} />
        </Section>

        <Section title="Contacto y domicilio">
          <Field label="Teléfono celular" value={telCel} />
          <Field label="Teléfono casa" value={telCasa} />
          <Field label="Correo" value={correo} />
          <Field label="Domicilio" value={domicilio} full />
        </Section>

        <Section title="Identificaciones">
          <Field label="Licencia de conducir" value={lic?.numero_licencia as string} />
          <Field label="Tipo de licencia" value={lic?.tipo as string} />
          <Field label="Vence licencia" value={lic ? fmtFechaCorta(lic.fecha_vencimiento as string) : undefined} />
          <Field label="Clave de elector" value={cred?.clave_elector as string} />
          <Field label="Sección" value={cred?.seccion as string} />
          <Field label="Vigencia credencial" value={cred?.vigencia as string} />
        </Section>

        {/* Concesiones y flota */}
        <SectionTable title={`Concesiones y flota (${concs.length})`}>
          {concs.length === 0 ? (
            <p className="text-sm text-slate-400">Sin concesiones registradas.</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-left text-slate-500">
                  <th className="py-1.5 pr-2 font-semibold">Concesión</th>
                  <th className="py-1.5 pr-2 font-semibold">Sitio</th>
                  <th className="py-1.5 pr-2 font-semibold">Unidad</th>
                  <th className="py-1.5 pr-2 font-semibold">Placas</th>
                  <th className="py-1.5 font-semibold">Póliza</th>
                </tr>
              </thead>
              <tbody>
                {concs.map((c) => {
                  const sitio = one(c.sitios);
                  const veh = one(c.vehiculos);
                  const pol = veh ? one(veh.polizas) : null;
                  const estadoPol = pol ? estadoPolizaVigente(pol.fecha_vencimiento as string, pol.estado as string) : null;
                  return (
                    <tr key={c.id as string} className="border-b border-slate-100 align-top">
                      <td className="py-1.5 pr-2">
                        <span className="mono font-medium">{c.numero_concesion as string}</span>
                        {c.taxi_numero != null && <span className="text-slate-400"> · Taxi {c.taxi_numero as number}</span>}
                      </td>
                      <td className="py-1.5 pr-2">{(sitio?.nombre as string) ?? '—'}</td>
                      <td className="py-1.5 pr-2">{veh ? `${(veh.marca as string) ?? ''} ${(veh.modelo as string) ?? ''} ${(veh.anio as number) ?? ''}`.trim() || '—' : '—'}</td>
                      <td className="py-1.5 pr-2 mono">{(veh?.placas as string) ?? '—'}</td>
                      <td className="py-1.5">{estadoPol ?? 'Sin póliza'}{pol ? ` · vence ${fmtFechaCorta(pol.fecha_vencimiento as string)}` : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </SectionTable>

        {/* Beneficiarios */}
        <SectionTable title={`Beneficiarios (${benes.length})`}>
          {benes.length === 0 ? (
            <p className="text-sm text-slate-400">Sin beneficiarios registrados.</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-left text-slate-500">
                  <th className="py-1.5 pr-2 font-semibold">Nombre</th>
                  <th className="py-1.5 pr-2 font-semibold">Parentesco</th>
                  <th className="py-1.5 pr-2 font-semibold">Teléfono</th>
                  <th className="py-1.5 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {benes.map((b) => (
                  <tr key={b.id as string} className="border-b border-slate-100">
                    <td className="py-1.5 pr-2">{b.nombre as string}</td>
                    <td className="py-1.5 pr-2">{(b.parentesco as string) ?? '—'}</td>
                    <td className="py-1.5 pr-2 mono">{(b.telefono as string) ?? '—'}</td>
                    <td className="py-1.5">{b.porcentaje != null ? `${b.porcentaje as number}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionTable>

        {/* Firmas */}
        <div className="mt-10 grid grid-cols-2 gap-10 text-center text-xs text-slate-500">
          <div className="border-t border-slate-400 pt-1">Firma del agremiado</div>
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

function SectionTable({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h3 className="mb-2 border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h3>
      {children}
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

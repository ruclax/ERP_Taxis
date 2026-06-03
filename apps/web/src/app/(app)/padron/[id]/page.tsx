import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@erp/db/client/server';
import { obtenerSocio } from '@erp/db/queries/socios';
import { Card, CardBody, CardHeader, Badge } from '@erp/ui/primitives';
import { SocioEstatusPill, PolizaEstadoPill, ConcesionEstadoPill } from '@erp/ui/data';
import { fmtFechaCorta, antiguedadTexto } from '@erp/shared/formatters';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ChoferesPanel from './_components/ChoferesPanel';

export default async function ExpedientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServer(await cookies());
  let socio;
  try {
    socio = await obtenerSocio(supabase, id);
  } catch {
    notFound();
  }
  if (!socio) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/padron" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 w-fit">
        <ArrowLeft size={14} /> Volver al padrón
      </Link>

      {/* Ficha de identidad */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center self-center rounded-2xl bg-slate-100 text-3xl font-bold text-slate-400 md:self-start">
              {socio.nombre_completo.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold ink">{socio.nombre_completo}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="mono rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {socio.codigo_agremiado}
                    </span>
                    <span className="text-slate-500">
                      <span className="label-erp">Tipo:</span> {socio.tipo_socio}
                    </span>
                    {socio.escalafon_numero != null && socio.tipo_escalafon !== 'NINGUNO' && (
                      <Badge tone={socio.tipo_escalafon === 'ASPIRANTE' ? 'warn' : 'info'}>
                        {socio.tipo_escalafon === 'ASPIRANTE' ? 'Aspirante' : 'Concesionario'} #{socio.escalafon_numero}
                      </Badge>
                    )}
                    <SocioEstatusPill estatus={socio.estatus} />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Field label="RFC" value={socio.rfc} mono />
                <Field label="CURP" value={socio.curp} mono />
                <Field label="Nacimiento" value={fmtFechaCorta(socio.fecha_nacimiento)} />
                <Field label="Ingreso" value={fmtFechaCorta(socio.fecha_ingreso)} />
                <Field label="Antigüedad" value={antiguedadTexto(socio.fecha_ingreso)} />
                <Field label="Turno" value={socio.turno ?? '—'} />
                <Field label="Firma actual" value={socio.firma_actual ? 'Sí' : 'No'} />
                <Field label="Estado civil" value={socio.estado_civil ?? '—'} />
                <Field label="Ocupación" value={socio.ocupacion ?? '—'} />
              </div>

              {/* Categorías sindicales */}
              <div className="mt-4 flex flex-wrap gap-2">
                {socio.soc_act && <Badge tone="success">SOC_ACT</Badge>}
                {socio.soc_veint && <Badge tone="warn">SOC_VEINT (20+ años)</Badge>}
                {socio.soc_tran && <Badge tone="info">SOC_TRAN</Badge>}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Concesiones */}
      <Card>
        <CardHeader
          title="Concesiones del socio"
          subtitle={
            socio.concesiones && socio.concesiones.length > 0
              ? `Este socio cuenta con ${socio.concesiones.length} concesión(es).`
              : 'Este socio no tiene concesiones registradas.'
          }
        />
        <CardBody>
          {(socio.concesiones ?? []).length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">Sin concesiones</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(socio.concesiones as unknown as Array<{
                id: string;
                numero_concesion: string;
                modalidad: string | null;
                taxi_numero: number | null;
                estado: string;
                sitios: { nombre: string } | null;
                vehiculos: Array<{
                  id: string;
                  placas: string | null;
                  marca: string | null;
                  modelo: string | null;
                  anio: number | null;
                  estatus: string;
                  polizas: Array<{ id: string; numero_poliza: string; compania: string; fecha_vencimiento: string; estado: string }>;
                }>;
              }>).map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mono text-lg font-semibold ink">{c.numero_concesion}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {c.modalidad ?? 'Sin modalidad'}
                        {c.taxi_numero ? ` · Taxi ${c.taxi_numero}` : ''}
                      </div>
                    </div>
                    <ConcesionEstadoPill estado={c.estado} />
                  </div>
                  {c.sitios && (
                    <div className="mt-2 text-sm text-slate-500">
                      <span className="label-erp">Sitio:</span> {c.sitios.nombre}
                    </div>
                  )}
                  {c.vehiculos && c.vehiculos.length > 0 && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3">
                      <div className="label-erp mb-1">Vehículo</div>
                      <div className="mono font-medium text-slate-800">{c.vehiculos[0].placas ?? '—'}</div>
                      <div className="text-xs text-slate-500">
                        {c.vehiculos[0].marca} {c.vehiculos[0].modelo} {c.vehiculos[0].anio ?? ''}
                      </div>
                      {c.vehiculos[0].polizas && c.vehiculos[0].polizas[0] && (
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            Vence {fmtFechaCorta(c.vehiculos[0].polizas[0].fecha_vencimiento)}
                          </span>
                          <PolizaEstadoPill estado={c.vehiculos[0].polizas[0].estado} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Choferes (vínculo laboral con esta concesión) */}
                  <ChoferesPanel
                    concesionId={c.id}
                    taxiNumero={c.taxi_numero}
                    numeroConcesion={c.numero_concesion}
                    expedienteSocioId={id}
                  />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Comentarios libres */}
      {socio.comentarios && (
        <Card>
          <CardHeader title="Comentarios del expediente" />
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{socio.comentarios}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <div className="label-erp">{label}</div>
      <div className={`text-sm text-slate-800 truncate ${mono ? 'mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}

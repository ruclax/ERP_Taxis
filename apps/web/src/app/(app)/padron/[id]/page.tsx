import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@erp/db/client/server';
import { obtenerSocio, listarHistorialEstatus } from '@erp/db/queries/socios';
import { listarDocumentosExpediente, type Documento } from '@erp/db/queries/documentos';
import { Card, CardBody, CardHeader, Badge } from '@erp/ui/primitives';
import { SocioEstatusPill, ConcesionEstadoPill } from '@erp/ui/data';
import { fmtFechaCorta, antiguedadTexto, estadoPolizaVigente } from '@erp/shared/formatters';
import { ChevronRight, AlertTriangle, Printer } from 'lucide-react';
import Link from 'next/link';
import ChoferesPanel from './_components/ChoferesPanel';
import DocumentosPanel from './_components/DocumentosPanel';
import EditarSocioModal, { type SocioEditable } from './_components/EditarSocioModal';
import ContactoDomicilioPanel, { type Contacto, type Direccion } from './_components/ContactoDomicilioPanel';
import BeneficiariosPanel, { type Beneficiario } from './_components/BeneficiariosPanel';
import IdentificacionesPanel, { type Licencia, type Credencial } from './_components/IdentificacionesPanel';
import EstatusPanel, { type HistorialItem } from './_components/EstatusPanel';
import FotoSocio from './_components/FotoSocio';
import AccionesMenu from './_components/AccionesMenu';
import VehiculoPolizaPanel, { type Vehiculo, type Poliza } from './_components/VehiculoPolizaPanel';
import ExpedienteTabs from './_components/ExpedienteTabs';

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

  const concesionesRaw = (socio.concesiones as Array<Record<string, unknown>> | null) ?? [];
  const concesionIds = concesionesRaw.map((c) => c.id as string);
  const vehiculoIds = concesionesRaw.flatMap((c) => ((c.vehiculos as Array<{ id: string }>) ?? []).map((v) => v.id));
  const polizaIds = concesionesRaw.flatMap((c) =>
    ((c.vehiculos as Array<{ polizas?: Array<{ id: string }> }>) ?? []).flatMap((v) => (v.polizas ?? []).map((p) => p.id))
  );

  let documentos: Documento[] = [];
  try {
    documentos = await listarDocumentosExpediente(supabase, { socioId: id, concesionIds, vehiculoIds, polizaIds });
  } catch {
    documentos = [];
  }
  const docsSocio = documentos.filter((d) => d.socio_id === id);

  let historialEstatus: HistorialItem[] = [];
  try {
    historialEstatus = await listarHistorialEstatus(supabase, id);
  } catch {
    historialEstatus = [];
  }

  let adeudosPend = 0;
  try {
    const { count } = await supabase
      .from('adeudos')
      .select('id', { count: 'exact', head: true })
      .eq('socio_id', id)
      .gt('monto_pendiente', 0);
    adeudosPend = count ?? 0;
  } catch { adeudosPend = 0; }

  const alertas = alertasDe(socio, adeudosPend);

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/padron" className="hover:text-slate-700">Padrón</Link>
        <ChevronRight size={14} className="text-slate-400" />
        <span className="truncate font-medium text-slate-700">{socio.nombre_completo}</span>
      </nav>

      {/* Encabezado compacto y sticky — identidad + alertas siempre visibles */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200/70 bg-slate-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center gap-4">
          <FotoSocio
            socioId={id}
            fotoUrl={(socio.foto_url as string | null) ?? null}
            iniciales={socio.nombre_completo.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()}
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold ink">{socio.nombre_completo}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="mono rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                {socio.codigo_agremiado}
              </span>
              <span className="text-slate-500"><span className="label-erp">Tipo:</span> {socio.tipo_socio}</span>
              {socio.escalafon_numero != null && socio.tipo_escalafon !== 'NINGUNO' && (
                <Badge tone={socio.tipo_escalafon === 'ASPIRANTE' ? 'warn' : 'info'}>
                  {socio.tipo_escalafon === 'ASPIRANTE' ? 'Aspirante' : 'Concesionario'} #{socio.escalafon_numero}
                </Badge>
              )}
              <SocioEstatusPill estatus={socio.estatus} />
              {alertas.map((a) => (
                <span
                  key={a.label}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${a.tone === 'accent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}
                >
                  <AlertTriangle size={11} /> {a.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/imprimir/socio/${id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer size={15} /> <span className="hidden sm:inline">Imprimir</span>
            </a>
            <AccionesMenu />
            <EditarSocioModal socioId={id} socio={socioEditable(socio)} />
          </div>
        </div>
      </div>

      {/* Detalle del expediente en pestañas */}
      <ExpedienteTabs
        counts={{
          concesiones: (socio.concesiones as unknown[] | null)?.length ?? 0,
          documentos: docsSocio.length,
          beneficiarios: beneficiariosDe(socio).length,
        }}
        general={
          <>
            <Card>
              <CardHeader title="Datos personales" />
              <CardBody>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
                <div className="mt-4 flex flex-wrap gap-2">
                  {socio.soc_act && <Badge tone="success">SOC_ACT</Badge>}
                  {socio.soc_veint && <Badge tone="warn">SOC_VEINT (20+ años)</Badge>}
                  {socio.soc_tran && <Badge tone="info">SOC_TRAN</Badge>}
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Estatus y ciclo de vida" subtitle="Altas, bajas, reactivaciones y defunción con su historial." />
              <CardBody>
                <EstatusPanel socioId={id} estatusActual={socio.estatus} historial={historialEstatus} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Contacto y domicilio" />
              <CardBody>
                <ContactoDomicilioPanel
                  socioId={id}
                  direccion={direccionActual(socio)}
                  contactos={contactosDe(socio)}
                />
              </CardBody>
            </Card>
            {socio.comentarios && (
              <Card>
                <CardHeader title="Comentarios del expediente" />
                <CardBody>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{socio.comentarios}</p>
                </CardBody>
              </Card>
            )}
          </>
        }
        concesiones={
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
            <div className="grid grid-cols-1 gap-4">
              {(socio.concesiones as unknown as Array<{
                id: string;
                numero_concesion: string;
                modalidad: string | null;
                taxi_numero: number | null;
                estado: string;
                sitios: { nombre: string } | null;
                vehiculos: Array<Vehiculo & { polizas: Poliza[] }>;
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
                  <VehiculoPolizaPanel
                    expedienteSocioId={id}
                    concesionId={c.id}
                    vehiculo={c.vehiculos?.[0] ?? null}
                    poliza={c.vehiculos?.[0]?.polizas?.[0] ?? null}
                    polizaDocumentos={documentos.filter((d) => d.poliza_id === c.vehiculos?.[0]?.polizas?.[0]?.id)}
                  />

                  {/* Choferes (vínculo laboral con esta concesión) */}
                  <ChoferesPanel
                    concesionId={c.id}
                    taxiNumero={c.taxi_numero}
                    numeroConcesion={c.numero_concesion}
                    expedienteSocioId={id}
                  />

                  {/* Documentos de la concesión — título (Fase 3 / M5) */}
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="label-erp mb-2">Documentos de la concesión (título)</div>
                    <DocumentosPanel
                      owner={{ tipo: 'concesion', id: c.id }}
                      expedienteSocioId={id}
                      documentos={documentos.filter((d) => d.concesion_id === c.id)}
                      compact
                      defaultTipo="TITULO_CONCESION"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

        }
        identificaciones={
          <Card>
            <CardHeader title="Identificaciones" subtitle="Licencia de conducir y credencial de elector." />
            <CardBody>
              <IdentificacionesPanel socioId={id} licencia={licenciaDe(socio)} credencial={credencialDe(socio)} />
            </CardBody>
          </Card>
        }
        beneficiarios={
          <Card>
            <CardHeader
              title="Beneficiarios"
              subtitle="Cónyuge y designados oficiales para efectos de sucesión y paquete funerario."
            />
            <CardBody>
              <BeneficiariosPanel socioId={id} beneficiarios={beneficiariosDe(socio)} />
            </CardBody>
          </Card>
        }
        documentos={
          <Card>
            <CardHeader
              title="Documentos"
              subtitle="Licencias, pólizas, títulos y demás documentos digitalizados del socio."
            />
            <CardBody>
              <DocumentosPanel owner={{ tipo: 'socio', id }} expedienteSocioId={id} documentos={docsSocio} />
            </CardBody>
          </Card>
        }
      />
    </div>
  );
}

function direccionActual(socio: Record<string, unknown>): Direccion | null {
  const dirs = (socio.socios_direcciones as Record<string, unknown>[] | null) ?? [];
  const d = dirs.find((x) => x.es_actual === true) ?? dirs[0];
  if (!d) return null;
  return {
    calle: (d.calle as string | null) ?? null,
    numero_ext: (d.numero_ext as string | null) ?? null,
    numero_int: (d.numero_int as string | null) ?? null,
    colonia: (d.colonia as string | null) ?? null,
    ciudad: (d.ciudad as string | null) ?? null,
    estado: (d.estado as string | null) ?? null,
    codigo_postal: (d.codigo_postal as string | null) ?? null,
    referencias: (d.referencias as string | null) ?? null,
  };
}

function pickOne(v: unknown): Record<string, unknown> | null {
  if (Array.isArray(v)) return (v[0] as Record<string, unknown>) ?? null;
  if (v && typeof v === 'object') return v as Record<string, unknown>;
  return null;
}

function licenciaDe(socio: Record<string, unknown>): Licencia | null {
  const arr = socio.socios_licencia_conducir as Record<string, unknown>[] | null;
  const l = (arr ?? []).find((x) => x.es_actual === true) ?? (arr ?? [])[0];
  if (!l) return null;
  return {
    numero_licencia: (l.numero_licencia as string | null) ?? null,
    tipo: (l.tipo as string | null) ?? null,
    fecha_emision: (l.fecha_emision as string | null) ?? null,
    fecha_vencimiento: (l.fecha_vencimiento as string | null) ?? null,
    observaciones: (l.observaciones as string | null) ?? null,
  };
}

function credencialDe(socio: Record<string, unknown>): Credencial | null {
  const c = pickOne(socio.socios_credencial_elector);
  if (!c) return null;
  return {
    clave_elector: (c.clave_elector as string | null) ?? null,
    seccion: (c.seccion as string | null) ?? null,
    vigencia: (c.vigencia as string | null) ?? null,
    emision: (c.emision as string | null) ?? null,
  };
}

function beneficiariosDe(socio: Record<string, unknown>): Beneficiario[] {
  const bs = (socio.socios_beneficiarios as Record<string, unknown>[] | null) ?? [];
  return bs.map((b) => ({
    id: b.id as string,
    nombre: (b.nombre as string) ?? '',
    parentesco: (b.parentesco as string | null) ?? null,
    telefono: (b.telefono as string | null) ?? null,
    direccion: (b.direccion as string | null) ?? null,
    porcentaje: (b.porcentaje as number | null) ?? null,
    es_designado: Boolean(b.es_designado),
    notas: (b.notas as string | null) ?? null,
  }));
}

function contactosDe(socio: Record<string, unknown>): Contacto[] {
  const cs = (socio.socios_contactos as Record<string, unknown>[] | null) ?? [];
  return cs.map((c) => ({
    id: c.id as string,
    tipo: c.tipo as string,
    valor: c.valor as string,
    es_principal: Boolean(c.es_principal),
  }));
}

function socioEditable(socio: Record<string, unknown>): SocioEditable {
  return {
    nombre_completo: (socio.nombre_completo as string) ?? '',
    rfc: (socio.rfc as string | null) ?? null,
    curp: (socio.curp as string | null) ?? null,
    fecha_nacimiento: (socio.fecha_nacimiento as string | null) ?? null,
    fecha_ingreso: (socio.fecha_ingreso as string | null) ?? null,
    tipo_socio: (socio.tipo_socio as SocioEditable['tipo_socio']) ?? 'CONCESIONARIO',
    genero: (socio.genero as SocioEditable['genero']) ?? null,
    estado_civil: (socio.estado_civil as string | null) ?? null,
    ocupacion: (socio.ocupacion as string | null) ?? null,
    turno: (socio.turno as string | null) ?? null,
    escalafon_numero: (socio.escalafon_numero as number | null) ?? null,
    tipo_escalafon: (socio.tipo_escalafon as SocioEditable['tipo_escalafon']) ?? 'NINGUNO',
    tipo_padron: (socio.tipo_padron as SocioEditable['tipo_padron']) ?? null,
    soc_act: Boolean(socio.soc_act),
    soc_veint: Boolean(socio.soc_veint),
    soc_tran: Boolean(socio.soc_tran),
    firma_actual: Boolean(socio.firma_actual),
  };
}

function diasHasta(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - hoy.getTime()) / 86_400_000);
}

/** Chips de alerta del socio: licencia/póliza por vencer o vencida, y adeudos pendientes. */
function alertasDe(socio: Record<string, unknown>, adeudosPend: number): Array<{ tone: 'accent' | 'warn'; label: string }> {
  const out: Array<{ tone: 'accent' | 'warn'; label: string }> = [];

  const lics = (socio.socios_licencia_conducir as Array<Record<string, unknown>> | null) ?? [];
  const lic = lics.find((x) => x.es_actual === true) ?? lics[0];
  const dLic = diasHasta(lic?.fecha_vencimiento as string | null);
  if (dLic != null) {
    if (dLic < 0) out.push({ tone: 'accent', label: 'Licencia vencida' });
    else if (dLic <= 30) out.push({ tone: 'warn', label: `Licencia vence en ${dLic}d` });
  }

  const concs = (socio.concesiones as Array<Record<string, unknown>> | null) ?? [];
  let polVencida = false, polPorVencer = false;
  for (const c of concs) {
    for (const v of ((c.vehiculos as Array<Record<string, unknown>>) ?? [])) {
      for (const p of ((v.polizas as Array<Record<string, unknown>>) ?? [])) {
        const est = estadoPolizaVigente(p.fecha_vencimiento as string | null, p.estado as string | null);
        if (est === 'VENCIDA') polVencida = true;
        else if (est === 'POR_VENCER') polPorVencer = true;
      }
    }
  }
  if (polVencida) out.push({ tone: 'accent', label: 'Póliza vencida' });
  else if (polPorVencer) out.push({ tone: 'warn', label: 'Póliza por vencer' });

  if (adeudosPend > 0) out.push({ tone: 'accent', label: `${adeudosPend} adeudo${adeudosPend > 1 ? 's' : ''}` });

  return out;
}

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <div className="label-erp">{label}</div>
      <div className={`text-sm text-slate-800 truncate ${mono ? 'mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wizard, Input, Card, CardBody } from '@erp/ui/primitives';
import { getBrowserSupabase } from '@erp/db/client';
import { buscarSocioPorClave } from '@erp/db/queries/socios';
import { crearSocio } from '../actions';
import type { NuevoSocioForm } from '@erp/shared/validators';

const RFC_RE = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;
const CURP_RE = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/;
type DupSocio = { id: string; nombre_completo: string; codigo_agremiado: string };

interface Props {
  sitios: { id: string; nombre: string }[];
}

type Form = {
  // Paso 1 — datos básicos
  nombre_completo: string;
  rfc: string;
  curp: string;
  fecha_nacimiento: string;
  genero: 'M' | 'F' | 'X' | '';
  tipo_socio: 'CONCESIONARIO' | 'AGENCIA' | 'PERMISIONARIO' | 'INDEPENDIENTE' | 'HEREDERO' | 'OTRO';
  fecha_ingreso: string;
  // Paso 2 — contacto/dirección
  telefono_movil: string;
  telefono_fijo: string;
  email: string;
  calle: string;
  numero_ext: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigo_postal: string;
  // Paso 3 — concesión (opcional)
  agregar_concesion: boolean;
  numero_concesion: string;
  sitio_id: string;
  taxi_numero: string;
  // Notas
  comentarios: string;
};

const initialForm: Form = {
  nombre_completo: '',
  rfc: '',
  curp: '',
  fecha_nacimiento: '',
  genero: '',
  tipo_socio: 'OTRO',
  fecha_ingreso: '',
  telefono_movil: '',
  telefono_fijo: '',
  email: '',
  calle: '',
  numero_ext: '',
  colonia: '',
  municipio: 'Nuevo Laredo',
  estado: 'Tamaulipas',
  codigo_postal: '',
  agregar_concesion: false,
  numero_concesion: '',
  sitio_id: '',
  taxi_numero: '',
  comentarios: '',
};

export default function NuevoSocioWizard({ sitios }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initialForm);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [dup, setDup] = useState<DupSocio | null>(null);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function verificarDuplicado() {
    const rfc = form.rfc.trim().toUpperCase();
    const curp = form.curp.trim().toUpperCase();
    if (!RFC_RE.test(rfc) && !CURP_RE.test(curp)) { setDup(null); return; }
    try {
      const found = await buscarSocioPorClave(getBrowserSupabase(), { rfc, curp });
      setDup(found);
    } catch { setDup(null); }
  }

  function buildPayload(): NuevoSocioForm {
    return {
      socio: {
        nombre_completo: form.nombre_completo.trim(),
        rfc: form.rfc.trim().toUpperCase(),
        curp: form.curp.trim().toUpperCase(),
        fecha_nacimiento: form.fecha_nacimiento || null,
        fecha_ingreso: form.fecha_ingreso || null,
        tipo_socio: form.tipo_socio,
        estatus: 'ACTIVO',
        soc_act: false,
        soc_veint: false,
        soc_tran: false,
        comentarios: form.comentarios.trim() || null,
      },
      direccion: {
        calle: form.calle.trim() || undefined,
        numero_ext: form.numero_ext.trim() || undefined,
        colonia: form.colonia.trim() || undefined,
        municipio: form.municipio.trim() || undefined,
        estado: form.estado.trim() || undefined,
        codigo_postal: form.codigo_postal.trim() || undefined,
      },
      contacto: {
        telefono_movil: form.telefono_movil.trim() || undefined,
        telefono_fijo: form.telefono_fijo.trim() || undefined,
        email: form.email.trim() || undefined,
      },
      concesion: form.agregar_concesion && form.numero_concesion.trim()
        ? {
            numero_concesion: form.numero_concesion.trim().toUpperCase(),
            sitio_id: form.sitio_id || null,
            taxi_numero: form.taxi_numero ? Number(form.taxi_numero) : null,
          }
        : undefined,
    };
  }

  function handleComplete() {
    setServerError(null);
    startTransition(async () => {
      const res = await crearSocio(buildPayload());
      if (res.ok) {
        router.push(`/padron/${res.socioId}`);
      } else {
        // Mostrar el detalle por campo cuando exista (en vez de "Datos inválidos" a secas).
        const detalle = res.fieldErrors ? Object.entries(res.fieldErrors).map(([k, v]) => `${k}: ${v}`).join(' · ') : '';
        setServerError(detalle ? `${res.error} — ${detalle}` : res.error);
      }
    });
  }

  return (
    <>
      <Wizard
        currentStep={step}
        onStepChange={setStep}
        onComplete={handleComplete}
        loading={pending}
        completeLabel="Crear socio"
        steps={[
          {
            id: 'datos',
            label: 'Datos básicos',
            description: 'Nombre, RFC y tipo',
            canContinue: () => {
              if (form.nombre_completo.trim().length < 3) return 'Captura el nombre completo del socio.';
              if (!RFC_RE.test(form.rfc.trim().toUpperCase())) return 'Captura un RFC válido (13 caracteres).';
              if (!CURP_RE.test(form.curp.trim().toUpperCase())) return 'Captura una CURP válida (18 caracteres).';
              if (dup) return 'Ese RFC/CURP ya está registrado. Abre el perfil existente.';
              return true;
            },
            render: () => (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {dup && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 md:col-span-2">
                    <span>Ya existe un agremiado con ese RFC/CURP: <strong>{dup.nombre_completo}</strong> ({dup.codigo_agremiado}).</span>
                    <Link href={`/padron/${dup.id}`} className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
                      Ir a su perfil →
                    </Link>
                  </div>
                )}
                <div className="md:col-span-2">
                  <Input
                    label="Nombre completo *"
                    placeholder="Ej. Juan Pérez González"
                    inputSize="lg"
                    value={form.nombre_completo}
                    onChange={(e) => set('nombre_completo', e.target.value)}
                    autoFocus
                  />
                </div>
                <Input
                  label="RFC *"
                  placeholder="13 caracteres"
                  inputSize="lg"
                  value={form.rfc}
                  onChange={(e) => set('rfc', e.target.value.toUpperCase())}
                  onBlur={verificarDuplicado}
                  maxLength={13}
                />
                <Input
                  label="CURP *"
                  placeholder="18 caracteres"
                  inputSize="lg"
                  value={form.curp}
                  onChange={(e) => set('curp', e.target.value.toUpperCase())}
                  onBlur={verificarDuplicado}
                  maxLength={18}
                />
                <Input
                  label="Fecha de nacimiento"
                  type="date"
                  inputSize="lg"
                  value={form.fecha_nacimiento}
                  onChange={(e) => set('fecha_nacimiento', e.target.value)}
                />
                <SelectField
                  label="Categoría especial (opcional)"
                  value={form.tipo_socio}
                  onChange={(v) => set('tipo_socio', v as Form['tipo_socio'])}
                  options={[
                    { value: 'OTRO',          label: 'Ninguna / General' },
                    { value: 'AGENCIA',       label: 'Agencia' },
                    { value: 'PERMISIONARIO', label: 'Permisionario' },
                    { value: 'INDEPENDIENTE', label: 'Independiente' },
                    { value: 'HEREDERO',      label: 'Heredero' },
                  ]}
                />
                <Input
                  label="Fecha de ingreso al sindicato"
                  type="date"
                  inputSize="lg"
                  value={form.fecha_ingreso}
                  onChange={(e) => set('fecha_ingreso', e.target.value)}
                />
                <p className="text-sm text-secondary md:col-span-2">
                  <strong>Concesionario</strong> y <strong>Chofer</strong> se asignan solos: “Concesionario” si agregas una concesión (paso 3),
                  y “Chofer” según la ocupación. Aquí solo eliges una categoría especial si aplica.
                </p>
              </div>
            ),
          },
          {
            id: 'contacto',
            label: 'Contacto y dirección',
            description: 'Cómo localizarlo',
            render: () => (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="label-erp mb-2">Contacto</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input
                      label="Teléfono móvil"
                      type="tel"
                      placeholder="867 123 4567"
                      inputSize="lg"
                      value={form.telefono_movil}
                      onChange={(e) => set('telefono_movil', e.target.value)}
                    />
                    <Input
                      label="Teléfono fijo"
                      type="tel"
                      placeholder="867 555 0100"
                      inputSize="lg"
                      value={form.telefono_fijo}
                      onChange={(e) => set('telefono_fijo', e.target.value)}
                    />
                    <Input
                      label="Correo electrónico"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      inputSize="lg"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="label-erp mb-2">Dirección</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <Input
                        label="Calle"
                        inputSize="lg"
                        value={form.calle}
                        onChange={(e) => set('calle', e.target.value)}
                      />
                    </div>
                    <Input
                      label="Número exterior"
                      inputSize="lg"
                      value={form.numero_ext}
                      onChange={(e) => set('numero_ext', e.target.value)}
                    />
                    <Input
                      label="Colonia"
                      inputSize="lg"
                      value={form.colonia}
                      onChange={(e) => set('colonia', e.target.value)}
                    />
                    <Input
                      label="Municipio"
                      inputSize="lg"
                      value={form.municipio}
                      onChange={(e) => set('municipio', e.target.value)}
                    />
                    <Input
                      label="Código postal"
                      inputSize="lg"
                      value={form.codigo_postal}
                      onChange={(e) => set('codigo_postal', e.target.value)}
                      maxLength={5}
                    />
                  </div>
                </div>
                <p className="text-sm text-secondary">
                  Todos los campos de este paso son opcionales. Puedes completarlos más tarde desde el expediente.
                </p>
              </div>
            ),
          },
          {
            id: 'concesion',
            label: 'Concesión',
            description: 'Opcional',
            render: () => (
              <div className="flex flex-col gap-4">
                <label className="tap-target flex cursor-pointer items-start gap-3 rounded-lg border-2 border-slate-200 p-4 hover:border-slate-300">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 cursor-pointer accent-blue-600"
                    checked={form.agregar_concesion}
                    onChange={(e) => set('agregar_concesion', e.target.checked)}
                  />
                  <span>
                    <span className="block text-[15px] font-semibold ink">Vincular una concesión ahora</span>
                    <span className="block text-sm text-secondary">
                      Si el socio ya tiene número de concesión (ej. 27P-0325), captúralo. Si no, puedes agregarla más tarde.
                    </span>
                  </span>
                </label>

                {form.agregar_concesion && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input
                      label="Número de concesión *"
                      placeholder="27P-0325"
                      inputSize="lg"
                      value={form.numero_concesion}
                      onChange={(e) => set('numero_concesion', e.target.value.toUpperCase())}
                    />
                    <SelectField
                      label="Sitio"
                      value={form.sitio_id}
                      onChange={(v) => set('sitio_id', v)}
                      options={[
                        { value: '', label: '— Sin sitio asignado —' },
                        ...sitios.map((s) => ({ value: s.id, label: s.nombre })),
                      ]}
                    />
                    <Input
                      label="Número de taxi"
                      type="number"
                      inputSize="lg"
                      value={form.taxi_numero}
                      onChange={(e) => set('taxi_numero', e.target.value)}
                    />
                  </div>
                )}
              </div>
            ),
          },
          {
            id: 'confirmar',
            label: 'Confirmar',
            description: 'Revisa y crea',
            render: () => (
              <div className="flex flex-col gap-4">
                <Card>
                  <CardBody className="flex flex-col gap-3">
                    <ResumenRow titulo="Nombre" valor={form.nombre_completo || '—'} />
                    <ResumenRow titulo="Categoría" valor={form.tipo_socio === 'OTRO' ? 'General' : form.tipo_socio} />
                    {form.agregar_concesion && form.numero_concesion.trim() && (
                      <ResumenRow titulo="Clasificación" valor="Concesionario (por su concesión)" />
                    )}
                    {form.rfc && <ResumenRow titulo="RFC" valor={form.rfc} />}
                    {form.curp && <ResumenRow titulo="CURP" valor={form.curp} />}
                    {form.fecha_nacimiento && <ResumenRow titulo="Nacimiento" valor={form.fecha_nacimiento} />}
                    {form.fecha_ingreso && <ResumenRow titulo="Ingreso" valor={form.fecha_ingreso} />}
                    {form.telefono_movil && <ResumenRow titulo="Móvil" valor={form.telefono_movil} />}
                    {form.email && <ResumenRow titulo="Email" valor={form.email} />}
                    {(form.calle || form.colonia) && (
                      <ResumenRow
                        titulo="Domicilio"
                        valor={[form.calle, form.numero_ext, form.colonia, form.municipio]
                          .filter(Boolean).join(', ')}
                      />
                    )}
                    {form.agregar_concesion && form.numero_concesion && (
                      <ResumenRow
                        titulo="Concesión"
                        valor={`${form.numero_concesion}${form.taxi_numero ? ` · Taxi #${form.taxi_numero}` : ''}`}
                      />
                    )}
                  </CardBody>
                </Card>

                <div>
                  <label className="label-erp mb-1 block">Comentarios (opcional)</label>
                  <textarea
                    rows={3}
                    value={form.comentarios}
                    onChange={(e) => set('comentarios', e.target.value)}
                    placeholder="Notas internas que quedarán en el expediente…"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {(!(form.telefono_movil || form.telefono_fijo) || !form.fecha_nacimiento) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Falta {[
                      !(form.telefono_movil || form.telefono_fijo) && 'un teléfono',
                      !form.fecha_nacimiento && 'la fecha de nacimiento',
                    ].filter(Boolean).join(' y ')}. Puedes crear el socio ahora y completarlo después desde el expediente.
                  </div>
                )}

                {serverError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {serverError}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label-erp">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-[15px] text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ResumenRow({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
      <span className="w-32 shrink-0 text-xs uppercase tracking-wider text-secondary">{titulo}</span>
      <span className="text-[15px] text-slate-900">{valor}</span>
    </div>
  );
}

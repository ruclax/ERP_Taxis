'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input } from '@erp/ui/primitives';
import { Pencil } from 'lucide-react';
import { actualizarSocioAction } from '../actions';

type TipoSocio = 'CONCESIONARIO' | 'AGENCIA' | 'PERMISIONARIO' | 'INDEPENDIENTE' | 'HEREDERO' | 'OTRO';
type TipoEscalafon = 'CONCESIONARIO' | 'ASPIRANTE' | 'NINGUNO';
type TipoPadron = 'CONCESIONARIO' | 'TRANSITORIO' | 'CUOTA_25';

export interface SocioEditable {
  nombre_completo: string;
  rfc: string | null;
  curp: string | null;
  fecha_nacimiento: string | null;
  fecha_ingreso: string | null;
  tipo_socio: TipoSocio;
  genero: 'M' | 'F' | 'X' | null;
  estado_civil: string | null;
  ocupacion: string | null;
  turno: string | null;
  escalafon_numero: number | null;
  tipo_escalafon: TipoEscalafon;
  tipo_padron: TipoPadron | null;
  soc_act: boolean;
  soc_veint: boolean;
  soc_tran: boolean;
  firma_actual: boolean;
}

const s = (v: string | null | undefined) => v ?? '';

export default function EditarSocioModal({ socioId, socio }: { socioId: string; socio: SocioEditable }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<SocioEditable>(socio);

  function set<K extends keyof SocioEditable>(k: K, v: SocioEditable[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function abrir() {
    setF(socio);       // re-sincroniza con los valores actuales
    setError(null);
    setOpen(true);
  }

  function guardar() {
    setError(null);
    if (f.nombre_completo.trim().length < 3) {
      setError('El nombre completo es obligatorio');
      return;
    }
    startTransition(async () => {
      const r = await actualizarSocioAction(socioId, {
        nombre_completo: f.nombre_completo.trim(),
        rfc: f.rfc?.trim() || null,
        curp: f.curp?.trim() || null,
        fecha_nacimiento: f.fecha_nacimiento || null,
        fecha_ingreso: f.fecha_ingreso || null,
        tipo_socio: f.tipo_socio,
        genero: f.genero,
        estado_civil: f.estado_civil?.trim() || null,
        ocupacion: f.ocupacion?.trim() || null,
        turno: f.turno?.trim() || null,
        escalafon_numero: f.escalafon_numero,
        tipo_escalafon: f.tipo_escalafon,
        tipo_padron: f.tipo_padron,
        soc_act: f.soc_act,
        soc_veint: f.soc_veint,
        soc_tran: f.soc_tran,
        firma_actual: f.firma_actual,
      });
      if (r.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" iconLeft={<Pencil size={14} />} onClick={abrir}>
        Editar
      </Button>

      {open && (
        <Modal title="Editar datos del socio" onClose={() => setOpen(false)} size="2xl">
          <div className="flex flex-col gap-5">
            {/* ── Datos personales ── */}
            <section>
              <h4 className="label-erp mb-2">Datos personales</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input label="Nombre completo *" value={f.nombre_completo}
                    onChange={(e) => set('nombre_completo', e.target.value)} />
                </div>
                <Input label="RFC" value={s(f.rfc)} maxLength={13}
                  onChange={(e) => set('rfc', e.target.value.toUpperCase())} />
                <Input label="CURP" value={s(f.curp)} maxLength={18}
                  onChange={(e) => set('curp', e.target.value.toUpperCase())} />
                <Input label="Fecha de nacimiento" type="date" value={s(f.fecha_nacimiento)}
                  onChange={(e) => set('fecha_nacimiento', e.target.value)} />
                <Input label="Fecha de ingreso" type="date" value={s(f.fecha_ingreso)}
                  onChange={(e) => set('fecha_ingreso', e.target.value)} />
                <Select label="Tipo de socio" value={f.tipo_socio}
                  onChange={(v) => set('tipo_socio', v as TipoSocio)}
                  options={['CONCESIONARIO', 'AGENCIA', 'PERMISIONARIO', 'INDEPENDIENTE', 'HEREDERO', 'OTRO']} />
                <Select label="Género" value={s(f.genero)}
                  onChange={(v) => set('genero', (v || null) as SocioEditable['genero'])}
                  options={['', 'M', 'F', 'X']} labels={{ '': '— Sin especificar —' }} />
                <Input label="Estado civil" value={s(f.estado_civil)}
                  onChange={(e) => set('estado_civil', e.target.value)} />
                <Input label="Ocupación" value={s(f.ocupacion)}
                  onChange={(e) => set('ocupacion', e.target.value)} />
                <Input label="Turno" value={s(f.turno)}
                  onChange={(e) => set('turno', e.target.value)} />
              </div>
            </section>

            {/* ── Clasificación sindical ── */}
            <section>
              <h4 className="label-erp mb-2">Clasificación sindical</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input label="Número de escalafón" type="number" value={f.escalafon_numero ?? ''}
                  onChange={(e) => set('escalafon_numero', e.target.value ? Number(e.target.value) : null)} />
                <Select label="Tipo de escalafón" value={f.tipo_escalafon}
                  onChange={(v) => set('tipo_escalafon', v as TipoEscalafon)}
                  options={['NINGUNO', 'CONCESIONARIO', 'ASPIRANTE']} />
                <Select label="Tipo de padrón" value={s(f.tipo_padron)}
                  onChange={(v) => set('tipo_padron', (v || null) as TipoPadron | null)}
                  options={['', 'CONCESIONARIO', 'TRANSITORIO', 'CUOTA_25']} labels={{ '': '— Sin especificar —' }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                <Check label="Socio activo (SOC_ACT)" checked={f.soc_act} onChange={(v) => set('soc_act', v)} />
                <Check label="20+ años (SOC_VEINT)" checked={f.soc_veint} onChange={(v) => set('soc_veint', v)} />
                <Check label="Transitorio (SOC_TRAN)" checked={f.soc_tran} onChange={(v) => set('soc_tran', v)} />
                <Check label="Firma actual recabada" checked={f.firma_actual} onChange={(v) => set('firma_actual', v)} />
              </div>
            </section>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
              <Button onClick={guardar} disabled={pending}>{pending ? 'Guardando…' : 'Guardar cambios'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Select({
  label, value, onChange, options, labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label-erp">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[15px]"
      >
        {options.map((o) => (
          <option key={o} value={o}>{labels?.[o] ?? o}</option>
        ))}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={checked}
        onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

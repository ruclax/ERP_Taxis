'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input } from '@erp/ui/primitives';
import { Pencil, IdCard, CreditCard } from 'lucide-react';
import { guardarLicenciaAction, guardarCredencialAction } from '../actions';

export interface Licencia {
  numero_licencia: string | null;
  tipo: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  observaciones: string | null;
}
export interface Credencial {
  clave_elector: string | null;
  seccion: string | null;
  vigencia: string | null;
  emision: string | null;
}

const s = (v: string | null | undefined) => v ?? '';
const fecha = (v: string | null) => (v ? v : '—');

export default function IdentificacionesPanel({
  socioId, licencia, credencial,
}: {
  socioId: string;
  licencia: Licencia | null;
  credencial: Credencial | null;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<'lic' | 'cred' | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* Licencia */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="label-erp flex items-center gap-1.5"><IdCard size={14} /> Licencia de conducir</span>
          <Button variant="ghost" size="sm" iconLeft={<Pencil size={13} />} onClick={() => { setError(null); setModal('lic'); }}>Editar</Button>
        </div>
        {licencia && (licencia.numero_licencia || licencia.fecha_vencimiento) ? (
          <div className="text-sm text-slate-700">
            <div className="mono">{licencia.numero_licencia ?? '—'} {licencia.tipo && <span className="text-xs text-slate-500">({licencia.tipo})</span>}</div>
            <div className="text-xs text-slate-500">Vence {fecha(licencia.fecha_vencimiento)}</div>
          </div>
        ) : <p className="text-sm text-slate-400">Sin licencia registrada</p>}
      </div>

      {/* Credencial de elector */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="label-erp flex items-center gap-1.5"><CreditCard size={14} /> Credencial de elector (INE)</span>
          <Button variant="ghost" size="sm" iconLeft={<Pencil size={13} />} onClick={() => { setError(null); setModal('cred'); }}>Editar</Button>
        </div>
        {credencial && (credencial.clave_elector || credencial.seccion) ? (
          <div className="text-sm text-slate-700">
            <div className="mono">{credencial.clave_elector ?? '—'}</div>
            <div className="text-xs text-slate-500">Sección {credencial.seccion ?? '—'} · Vigencia {fecha(credencial.vigencia)}</div>
          </div>
        ) : <p className="text-sm text-slate-400">Sin credencial registrada</p>}
      </div>

      {error && <p className="md:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {modal === 'lic' && (
        <LicenciaModal socioId={socioId} licencia={licencia}
          onClose={() => setModal(null)} onSaved={() => { setModal(null); router.refresh(); }} onError={setError} />
      )}
      {modal === 'cred' && (
        <CredencialModal socioId={socioId} credencial={credencial}
          onClose={() => setModal(null)} onSaved={() => { setModal(null); router.refresh(); }} onError={setError} />
      )}
    </div>
  );
}

function LicenciaModal({ socioId, licencia, onClose, onSaved, onError }: {
  socioId: string; licencia: Licencia | null; onClose: () => void; onSaved: () => void; onError: (m: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    numero_licencia: s(licencia?.numero_licencia), tipo: s(licencia?.tipo),
    fecha_emision: s(licencia?.fecha_emision), fecha_vencimiento: s(licencia?.fecha_vencimiento),
    observaciones: s(licencia?.observaciones),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  function guardar() {
    startTransition(async () => {
      const r = await guardarLicenciaAction(socioId, {
        numero_licencia: f.numero_licencia.trim() || null, tipo: f.tipo.trim() || null,
        fecha_emision: f.fecha_emision || null, fecha_vencimiento: f.fecha_vencimiento || null,
        observaciones: f.observaciones.trim() || null,
      });
      if (r.ok) onSaved(); else onError(r.error);
    });
  }
  return (
    <Modal title="Editar licencia de conducir" onClose={onClose} size="lg">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Número de licencia" value={f.numero_licencia} onChange={(e) => set('numero_licencia', e.target.value)} />
          <Input label="Tipo" value={f.tipo} onChange={(e) => set('tipo', e.target.value)} placeholder="A, B, transporte…" />
          <Input label="Fecha de emisión" type="date" value={f.fecha_emision} onChange={(e) => set('fecha_emision', e.target.value)} />
          <Input label="Fecha de vencimiento" type="date" value={f.fecha_vencimiento} onChange={(e) => set('fecha_vencimiento', e.target.value)} />
        </div>
        <Input label="Observaciones" value={f.observaciones} onChange={(e) => set('observaciones', e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function CredencialModal({ socioId, credencial, onClose, onSaved, onError }: {
  socioId: string; credencial: Credencial | null; onClose: () => void; onSaved: () => void; onError: (m: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    clave_elector: s(credencial?.clave_elector), seccion: s(credencial?.seccion),
    vigencia: s(credencial?.vigencia), emision: s(credencial?.emision),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  function guardar() {
    startTransition(async () => {
      const r = await guardarCredencialAction(socioId, {
        clave_elector: f.clave_elector.trim() || null, seccion: f.seccion.trim() || null,
        vigencia: f.vigencia || null, emision: f.emision.trim() || null,
      });
      if (r.ok) onSaved(); else onError(r.error);
    });
  }
  return (
    <Modal title="Editar credencial de elector" onClose={onClose} size="lg">
      <div className="flex flex-col gap-3">
        <Input label="Clave de elector" value={f.clave_elector} onChange={(e) => set('clave_elector', e.target.value)} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input label="Sección" value={f.seccion} onChange={(e) => set('seccion', e.target.value)} />
          <Input label="Vigencia" type="date" value={f.vigencia} onChange={(e) => set('vigencia', e.target.value)} />
          <Input label="Año de emisión" value={f.emision} onChange={(e) => set('emision', e.target.value)} placeholder="2020" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

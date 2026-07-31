'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input } from '@erp/ui/primitives';
import { Pencil } from 'lucide-react';
import { actualizarSitioAction } from '../actions';

export interface SitioEditable {
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  area_num: number | null;
  notas: string | null;
  activo: boolean;
}

const s = (v: string | null | undefined) => v ?? '';

export default function SitioDatosCard({ sitioId, sitio }: { sitioId: string; sitio: SitioEditable }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <Field label="Dirección" value={sitio.direccion} />
          <Field label="Teléfono" value={sitio.telefono} />
          <Field label="Área" value={sitio.area_num != null ? String(sitio.area_num) : null} />
          <Field label="Estado" value={sitio.activo ? 'Activo' : 'Inactivo'} />
          {sitio.notas && (
            <div className="sm:col-span-2">
              <div className="label-erp">Notas</div>
              <p className="text-sm text-slate-700">{sitio.notas}</p>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" iconLeft={<Pencil size={14} />} onClick={() => { setError(null); setOpen(true); }}>
          Editar
        </Button>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {open && (
        <EditarModal
          sitioId={sitioId}
          sitio={sitio}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); router.refresh(); }}
          onError={setError}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="label-erp">{label}</div>
      <div className="text-slate-700">{value || '—'}</div>
    </div>
  );
}

function EditarModal({
  sitioId, sitio, onClose, onSaved, onError,
}: {
  sitioId: string;
  sitio: SitioEditable;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    nombre: sitio.nombre,
    direccion: s(sitio.direccion),
    telefono: s(sitio.telefono),
    area_num: sitio.area_num != null ? String(sitio.area_num) : '',
    notas: s(sitio.notas),
    activo: sitio.activo,
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  function guardar() {
    if (f.nombre.trim().length < 2) { onError('El nombre es obligatorio'); return; }
    startTransition(async () => {
      const r = await actualizarSitioAction(sitioId, {
        nombre: f.nombre.trim(),
        direccion: f.direccion.trim() || null,
        telefono: f.telefono.trim() || null,
        area_num: f.area_num ? Number(f.area_num) : null,
        notas: f.notas.trim() || null,
        activo: f.activo,
      });
      if (r.ok) onSaved();
      else onError(r.error);
    });
  }

  return (
    <Modal title="Editar sitio" onClose={onClose} size="lg">
      <div className="flex flex-col gap-3">
        <Input label="Nombre *" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
        <Input label="Dirección" value={f.direccion} onChange={(e) => set('direccion', e.target.value)} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Teléfono" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} />
          <Input label="Área" type="number" value={f.area_num} onChange={(e) => set('area_num', e.target.value)} />
        </div>
        <Input label="Notas" value={f.notas} onChange={(e) => set('notas', e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={f.activo} onChange={(e) => set('activo', e.target.checked)} />
          Sitio activo
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

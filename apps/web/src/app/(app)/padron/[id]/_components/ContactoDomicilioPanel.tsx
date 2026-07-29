'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input, Badge } from '@erp/ui/primitives';
import { Pencil, Plus, Trash2, Phone, Mail, Home } from 'lucide-react';
import {
  guardarDireccionAction,
  agregarContactoAction,
  eliminarContactoAction,
} from '../actions';

type ContactoTipo = 'TEL_CEL' | 'TEL_CASA' | 'TEL_RECADO' | 'CORREO' | 'OTRO';

export interface Contacto { id: string; tipo: string; valor: string; es_principal: boolean }
export interface Direccion {
  calle: string | null; numero_ext: string | null; numero_int: string | null;
  colonia: string | null; ciudad: string | null; estado: string | null;
  codigo_postal: string | null; referencias: string | null;
}

const TIPO_CONTACTO: Record<string, string> = {
  TEL_CEL: 'Celular', TEL_CASA: 'Casa', TEL_RECADO: 'Recado', CORREO: 'Correo', OTRO: 'Otro',
};
const s = (v: string | null | undefined) => v ?? '';

export default function ContactoDomicilioPanel({
  socioId, direccion, contactos,
}: {
  socioId: string;
  direccion: Direccion | null;
  contactos: Contacto[];
}) {
  const router = useRouter();
  const [editDir, setEditDir] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirTexto = direccion
    ? [direccion.calle, direccion.numero_ext && `#${direccion.numero_ext}`, direccion.numero_int && `int ${direccion.numero_int}`,
       direccion.colonia, direccion.ciudad, direccion.estado, direccion.codigo_postal && `CP ${direccion.codigo_postal}`]
        .filter(Boolean).join(', ')
    : null;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* ── Domicilio ── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="label-erp flex items-center gap-1.5"><Home size={14} /> Domicilio</span>
          <Button variant="ghost" size="sm" iconLeft={<Pencil size={13} />} onClick={() => { setError(null); setEditDir(true); }}>
            Editar
          </Button>
        </div>
        {dirTexto ? (
          <p className="text-sm text-slate-700">{dirTexto}</p>
        ) : (
          <p className="text-sm text-slate-400">Sin domicilio registrado</p>
        )}
        {direccion?.referencias && (
          <p className="mt-1 text-xs text-slate-500">Ref: {direccion.referencias}</p>
        )}
      </div>

      {/* ── Contactos ── */}
      <div>
        <span className="label-erp flex items-center gap-1.5"><Phone size={14} /> Contactos</span>
        <ContactosLista socioId={socioId} contactos={contactos} />
      </div>

      {error && <p className="md:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {editDir && (
        <EditarDireccionModal
          socioId={socioId}
          direccion={direccion}
          onClose={() => setEditDir(false)}
          onSaved={() => { setEditDir(false); router.refresh(); }}
          onError={setError}
        />
      )}
    </div>
  );
}

function ContactosLista({ socioId, contactos }: { socioId: string; contactos: Contacto[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<ContactoTipo>('TEL_CEL');
  const [valor, setValor] = useState('');
  const [error, setError] = useState<string | null>(null);

  function agregar() {
    setError(null);
    if (!valor.trim()) { setError('Captura el valor'); return; }
    startTransition(async () => {
      const r = await agregarContactoAction(socioId, { tipo, valor, es_principal: false });
      if (r.ok) { setValor(''); router.refresh(); } else setError(r.error);
    });
  }
  function eliminar(id: string) {
    startTransition(async () => {
      const r = await eliminarContactoAction(id, socioId);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {contactos.length === 0 && <p className="text-sm text-slate-400">Sin contactos</p>}
      {contactos.map((c) => (
        <div key={c.id} className="flex items-center gap-2 text-sm">
          {c.tipo === 'CORREO' ? <Mail size={14} className="text-slate-400" /> : <Phone size={14} className="text-slate-400" />}
          <Badge tone="info">{TIPO_CONTACTO[c.tipo] ?? c.tipo}</Badge>
          <span className="flex-1 truncate text-slate-700">{c.valor}</span>
          {c.es_principal && <span className="text-xs text-emerald-600">principal</span>}
          <button onClick={() => eliminar(c.id)} disabled={pending} className="text-slate-400 hover:text-red-600" aria-label="Eliminar">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <div className="mt-1 flex items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="label-erp">Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as ContactoTipo)}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm">
            {(['TEL_CEL', 'TEL_CASA', 'TEL_RECADO', 'CORREO', 'OTRO'] as ContactoTipo[]).map((t) => (
              <option key={t} value={t}>{TIPO_CONTACTO[t]}</option>
            ))}
          </select>
        </label>
        <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Número o correo"
          className="h-9 flex-1 rounded-md border border-slate-300 px-2 text-sm" />
        <Button size="sm" iconLeft={<Plus size={14} />} onClick={agregar} disabled={pending}>Agregar</Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function EditarDireccionModal({
  socioId, direccion, onClose, onSaved, onError,
}: {
  socioId: string;
  direccion: Direccion | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState<Direccion>({
    calle: s(direccion?.calle), numero_ext: s(direccion?.numero_ext), numero_int: s(direccion?.numero_int),
    colonia: s(direccion?.colonia), ciudad: s(direccion?.ciudad) || 'Nuevo Laredo',
    estado: s(direccion?.estado) || 'Tamaulipas', codigo_postal: s(direccion?.codigo_postal),
    referencias: s(direccion?.referencias),
  });
  const set = (k: keyof Direccion, v: string) => setF((p) => ({ ...p, [k]: v }));

  function guardar() {
    startTransition(async () => {
      const r = await guardarDireccionAction(socioId, {
        calle: f.calle?.trim() || null, numero_ext: f.numero_ext?.trim() || null,
        numero_int: f.numero_int?.trim() || null, colonia: f.colonia?.trim() || null,
        ciudad: f.ciudad?.trim() || null, estado: f.estado?.trim() || null,
        codigo_postal: f.codigo_postal?.trim() || null, referencias: f.referencias?.trim() || null,
      });
      if (r.ok) onSaved(); else onError(r.error);
    });
  }

  return (
    <Modal title="Editar domicilio" onClose={onClose} size="lg">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2"><Input label="Calle" value={s(f.calle)} onChange={(e) => set('calle', e.target.value)} /></div>
          <Input label="Número ext." value={s(f.numero_ext)} onChange={(e) => set('numero_ext', e.target.value)} />
          <Input label="Número int." value={s(f.numero_int)} onChange={(e) => set('numero_int', e.target.value)} />
          <Input label="Colonia" value={s(f.colonia)} onChange={(e) => set('colonia', e.target.value)} />
          <Input label="Código postal" value={s(f.codigo_postal)} maxLength={5} onChange={(e) => set('codigo_postal', e.target.value)} />
          <Input label="Ciudad" value={s(f.ciudad)} onChange={(e) => set('ciudad', e.target.value)} />
          <Input label="Estado" value={s(f.estado)} onChange={(e) => set('estado', e.target.value)} />
        </div>
        <Input label="Referencias" value={s(f.referencias)} onChange={(e) => set('referencias', e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

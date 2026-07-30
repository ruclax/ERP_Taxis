'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Modal, Button, Input, Badge, ConfirmDialog } from '@erp/ui/primitives';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';
import { guardarBeneficiarioAction, eliminarBeneficiarioAction } from '../actions';

export interface Beneficiario {
  id: string;
  nombre: string;
  parentesco: string | null;
  telefono: string | null;
  direccion: string | null;
  porcentaje: number | null;
  es_designado: boolean;
  notas: string | null;
}

const s = (v: string | null | undefined) => v ?? '';

export default function BeneficiariosPanel({
  socioId, beneficiarios,
}: {
  socioId: string;
  beneficiarios: Beneficiario[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState<Beneficiario | 'nuevo' | null>(null);
  const [aEliminar, setAEliminar] = useState<Beneficiario | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Acción directa desde el menú del header: ?do=beneficiario abre "nuevo".
  useEffect(() => {
    if (searchParams.get('do') === 'beneficiario') {
      setError(null);
      setEditing('nuevo');
      const params = new URLSearchParams(searchParams.toString());
      params.delete('do');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function confirmarEliminar() {
    if (!aEliminar) return;
    setBorrando(true);
    const r = await eliminarBeneficiarioAction(aEliminar.id, socioId);
    setBorrando(false);
    setAEliminar(null);
    if (r.ok) router.refresh(); else setError(r.error);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" iconLeft={<UserPlus size={14} />} onClick={() => { setError(null); setEditing('nuevo'); }}>
          Agregar beneficiario
        </Button>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {beneficiarios.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">Sin beneficiarios registrados.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100">
          {beneficiarios.map((b) => (
            <li key={b.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{b.nombre}</span>
                  {b.parentesco && <span className="text-xs text-slate-500">{b.parentesco}</span>}
                  {b.es_designado && <Badge tone="success">Designado</Badge>}
                  {b.porcentaje != null && <Badge tone="info">{b.porcentaje}%</Badge>}
                </div>
                {(b.telefono || b.notas) && (
                  <div className="mt-0.5 text-xs text-slate-500">
                    {[b.telefono, b.notas].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              <button onClick={() => { setError(null); setEditing(b); }} className="text-slate-400 hover:text-slate-700" aria-label="Editar">
                <Pencil size={14} />
              </button>
              <button onClick={() => setAEliminar(b)} className="text-slate-400 hover:text-red-600" aria-label="Eliminar">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <BeneficiarioModal
          socioId={socioId}
          beneficiario={editing === 'nuevo' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
          onError={setError}
        />
      )}

      <ConfirmDialog
        open={aEliminar !== null}
        onClose={() => setAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar beneficiario"
        description={<>Se eliminará a <strong>{aEliminar?.nombre}</strong> de los beneficiarios del socio.</>}
        confirmLabel="Eliminar"
        tone="danger"
        loading={borrando}
      />
    </div>
  );
}

function BeneficiarioModal({
  socioId, beneficiario, onClose, onSaved, onError,
}: {
  socioId: string;
  beneficiario: Beneficiario | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    nombre: s(beneficiario?.nombre),
    parentesco: s(beneficiario?.parentesco),
    telefono: s(beneficiario?.telefono),
    direccion: s(beneficiario?.direccion),
    porcentaje: beneficiario?.porcentaje != null ? String(beneficiario.porcentaje) : '',
    es_designado: beneficiario?.es_designado ?? false,
    notas: s(beneficiario?.notas),
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  function guardar() {
    startTransition(async () => {
      const r = await guardarBeneficiarioAction(
        socioId,
        {
          nombre: f.nombre.trim(),
          parentesco: f.parentesco.trim() || null,
          telefono: f.telefono.trim() || null,
          direccion: f.direccion.trim() || null,
          porcentaje: f.porcentaje ? Number(f.porcentaje) : null,
          es_designado: f.es_designado,
          notas: f.notas.trim() || null,
        },
        beneficiario?.id
      );
      if (r.ok) onSaved(); else onError(r.error);
    });
  }

  return (
    <Modal title={beneficiario ? 'Editar beneficiario' : 'Nuevo beneficiario'} onClose={onClose} size="lg">
      <div className="flex flex-col gap-3">
        <Input label="Nombre completo *" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Parentesco" value={f.parentesco} onChange={(e) => set('parentesco', e.target.value)} placeholder="Cónyuge, hijo/a…" />
          <Input label="Teléfono" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} />
          <Input label="Porcentaje (0-100)" type="number" min={0} max={100} value={f.porcentaje} onChange={(e) => set('porcentaje', e.target.value)} />
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={f.es_designado} onChange={(e) => set('es_designado', e.target.checked)} />
            Beneficiario designado oficial
          </label>
        </div>
        <Input label="Dirección" value={f.direccion} onChange={(e) => set('direccion', e.target.value)} />
        <Input label="Notas" value={f.notas} onChange={(e) => set('notas', e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

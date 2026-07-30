'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Modal, Button } from '@erp/ui/primitives';
import { SocioEstatusPill } from '@erp/ui/data';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { fmtFechaCorta } from '@erp/shared/formatters';
import { cambiarEstatusAction } from '../actions';

type Estatus = 'ACTIVO' | 'FALLECIDO' | 'BAJA_DEFINITIVA' | 'BAJA_TEMPORAL' | 'NO_PERTENECE';

export interface HistorialItem {
  id: string;
  estatus_anterior: string | null;
  estatus_nuevo: string;
  motivo: string | null;
  fecha_efectiva: string | null;
  created_at: string;
}

const LABEL: Record<string, string> = {
  ACTIVO: 'Activo', FALLECIDO: 'Fallecido',
  BAJA_DEFINITIVA: 'Baja definitiva', BAJA_TEMPORAL: 'Baja temporal', NO_PERTENECE: 'No pertenece',
};
const OPCIONES: Estatus[] = ['ACTIVO', 'BAJA_TEMPORAL', 'BAJA_DEFINITIVA', 'FALLECIDO', 'NO_PERTENECE'];

export default function EstatusPanel({
  socioId, estatusActual, historial,
}: {
  socioId: string;
  estatusActual: string;
  historial: HistorialItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  // Acción directa desde el menú del header: ?do=estatus abre el modal.
  useEffect(() => {
    if (searchParams.get('do') === 'estatus') {
      setOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('do');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
    // Solo al montar / cambiar el param
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="label-erp">Estatus actual:</span>
          <SocioEstatusPill estatus={estatusActual} />
        </div>
        <Button variant="secondary" size="sm" iconLeft={<RefreshCw size={14} />} onClick={() => setOpen(true)}>
          Cambiar estatus
        </Button>
      </div>

      {historial.length > 0 && (
        <div>
          <span className="label-erp">Historial de cambios</span>
          <ul className="mt-2 flex flex-col gap-2">
            {historial.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-xs text-slate-400">{fmtFechaCorta(h.created_at)}</span>
                {h.estatus_anterior && <span className="text-slate-500">{LABEL[h.estatus_anterior] ?? h.estatus_anterior}</span>}
                <ArrowRight size={12} className="text-slate-400" />
                <span className="font-medium text-slate-700">{LABEL[h.estatus_nuevo] ?? h.estatus_nuevo}</span>
                {h.fecha_efectiva && <span className="text-xs text-slate-500">· efectiva {fmtFechaCorta(h.fecha_efectiva)}</span>}
                {h.motivo && <span className="text-xs text-slate-500">· {h.motivo}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <CambiarEstatusModal
          socioId={socioId}
          estatusActual={estatusActual}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

function CambiarEstatusModal({
  socioId, estatusActual, onClose, onSaved,
}: {
  socioId: string;
  estatusActual: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [nuevo, setNuevo] = useState<Estatus>(estatusActual === 'ACTIVO' ? 'BAJA_TEMPORAL' : 'ACTIVO');
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState<string | null>(null);

  const esBaja = nuevo === 'BAJA_DEFINITIVA' || nuevo === 'BAJA_TEMPORAL';
  const esFallecido = nuevo === 'FALLECIDO';

  function guardar() {
    setError(null);
    if (esBaja && !motivo.trim()) { setError('El motivo de la baja es obligatorio'); return; }
    if (esFallecido && !fecha) { setError('La fecha de fallecimiento es obligatoria'); return; }
    startTransition(async () => {
      const r = await cambiarEstatusAction(socioId, nuevo, motivo || null, fecha || null);
      if (r.ok) onSaved(); else setError(r.error);
    });
  }

  return (
    <Modal title="Cambiar estatus del socio" onClose={onClose} size="md">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label-erp">Nuevo estatus</span>
          <select value={nuevo} onChange={(e) => setNuevo(e.target.value as Estatus)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[15px]">
            {OPCIONES.filter((o) => o !== estatusActual).map((o) => (
              <option key={o} value={o}>{LABEL[o]}</option>
            ))}
          </select>
        </label>

        {esFallecido && (
          <label className="flex flex-col gap-1.5">
            <span className="label-erp">Fecha de fallecimiento *</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-[15px]" />
          </label>
        )}

        {esBaja && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="label-erp">Motivo de la baja *</span>
              <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)}
                placeholder="Renuncia, adeudo, cambio de sitio…"
                className="rounded-lg border border-slate-300 px-3 py-2 text-[15px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label-erp">Fecha efectiva (opcional)</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-[15px]" />
            </label>
          </>
        )}

        {nuevo === 'ACTIVO' && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Reactivar limpia las marcas de baja y fallecimiento del socio.
          </p>
        )}

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={pending}>{pending ? 'Guardando…' : 'Confirmar cambio'}</Button>
        </div>
      </div>
    </Modal>
  );
}

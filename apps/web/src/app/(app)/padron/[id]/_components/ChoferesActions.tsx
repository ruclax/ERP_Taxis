'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ConfirmDialog, Button, Input, SearchBox,
  type SearchBoxOption,
} from '@erp/ui/primitives';
import { UserPlus, UserMinus } from 'lucide-react';
import { getBrowserSupabase } from '@erp/db/client';
import { sugerirSocios } from '@erp/db/queries/socios';
import { asignarChoferAction, terminarChoferAction } from '../actions';

type ModeAdd = {
  mode: 'add';
  concesionId: string;
  numeroConcesion: string;
  taxiNumero: number | null;
  expedienteSocioId: string;
};
type ModeTerminate = {
  mode: 'terminate';
  contratoId: string;
  choferNombre: string;
  expedienteSocioId: string;
};
type ModeMarkTitular = {
  mode: 'markTitular';
  concesionId: string;
  numeroConcesion: string;
  taxiNumero: number | null;
  expedienteSocioId: string;
};
type Props = ModeAdd | ModeTerminate | ModeMarkTitular;

export default function ChoferesActions(props: Props) {
  if (props.mode === 'add') return <AddButton {...props} />;
  if (props.mode === 'terminate') return <TerminateButton {...props} />;
  return <MarkTitularButton {...props} />;
}

// ── Botón "Asignar chofer" + modal ──
function AddButton({ concesionId, numeroConcesion, taxiNumero, expedienteSocioId }: ModeAdd) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [chofer, setChofer] = useState<{ id: string; nombre: string } | null>(null);
  const [suggestions, setSuggestions] = useState<SearchBoxOption[]>([]);
  const [rol, setRol] = useState<'CHOFER' | 'CHOFER_RELEVO' | 'AYUDANTE'>('CHOFER');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [tipoEconomico, setTipoEconomico] = useState<'porcentaje' | 'renta' | 'ninguno'>('ninguno');
  const [montoEconomico, setMontoEconomico] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const sb = getBrowserSupabase();
      const sugs = await sugerirSocios(sb, query.trim());
      const seen = new Set<string>();
      const dedup = sugs.filter((s) => seen.has(s.id) ? false : (seen.add(s.id), true));
      setSuggestions(dedup.map((s) => ({
        id: s.id, label: s.nombre, sublabel: s.sub, badge: s.badge, value: s.nombre,
      })));
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, open]);

  function reset() {
    setQuery(''); setChofer(null); setSuggestions([]);
    setRol('CHOFER'); setFechaInicio(new Date().toISOString().slice(0, 10));
    setTipoEconomico('ninguno'); setMontoEconomico('');
    setObservaciones(''); setError(null);
  }

  function submit() {
    setError(null);
    if (!chofer) { setError('Selecciona al socio que será chofer'); return; }
    if (!fechaInicio) { setError('Captura la fecha de inicio del contrato'); return; }

    const monto = montoEconomico ? Number(montoEconomico) : null;
    if (tipoEconomico !== 'ninguno' && (!monto || monto <= 0)) {
      setError('Captura un monto válido o cambia a "ninguno"');
      return;
    }

    startTransition(async () => {
      const res = await asignarChoferAction({
        concesion_id: concesionId,
        chofer_socio_id: chofer.id,
        rol,
        fecha_inicio: fechaInicio,
        porcentaje: tipoEconomico === 'porcentaje' ? monto : null,
        renta_diaria: tipoEconomico === 'renta' ? monto : null,
        observaciones: observaciones.trim() || null,
        expediente_socio_id: expedienteSocioId,
      });
      if (res.ok) {
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        iconLeft={<UserPlus size={14} />}
        onClick={() => setOpen(true)}
      >
        Asignar chofer
      </Button>

      {open && (
        <Modal title={`Asignar chofer a ${taxiNumero ? `Taxi #${taxiNumero}` : numeroConcesion}`} onClose={() => { setOpen(false); reset(); }}>
          <div className="flex flex-col gap-4">
            <div>
              <SearchBox
                label="Buscar socio (por nombre, RFC o # escalafón)"
                placeholder="Empieza a escribir…"
                value={chofer ? chofer.nombre : query}
                onChange={(v) => { setChofer(null); setQuery(v); }}
                onClear={() => { setChofer(null); setQuery(''); }}
                onSelect={(opt) => {
                  setChofer({ id: opt.id, nombre: opt.label });
                  setQuery(opt.label);
                  setSuggestions([]);
                }}
                options={suggestions}
              />
              {chofer && (
                <p className="mt-1 text-xs text-emerald-700">
                  Seleccionado: <strong>{chofer.nombre}</strong>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="label-erp">Rol</span>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as typeof rol)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[15px]"
                >
                  <option value="CHOFER">Chofer</option>
                  <option value="CHOFER_RELEVO">Chofer de relevo</option>
                  <option value="AYUDANTE">Ayudante</option>
                </select>
              </label>
              <Input
                label="Fecha de inicio *"
                type="date"
                inputSize="lg"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="label-erp mb-2">Esquema económico (opcional)</p>
              <div className="flex gap-2">
                {(['ninguno', 'porcentaje', 'renta'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipoEconomico(t)}
                    className={`tap-target flex-1 rounded-lg border-2 px-3 text-sm font-medium ${
                      tipoEconomico === t
                        ? 'border-(--ink) bg-(--ink) text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t === 'ninguno' ? 'Sin esquema' : t === 'porcentaje' ? '% por cuenta' : 'Renta diaria'}
                  </button>
                ))}
              </div>
              {tipoEconomico !== 'ninguno' && (
                <div className="mt-3">
                  <Input
                    label={tipoEconomico === 'porcentaje' ? 'Porcentaje (0-100)' : 'Monto diario (MXN)'}
                    type="number"
                    inputSize="lg"
                    value={montoEconomico}
                    onChange={(e) => setMontoEconomico(e.target.value)}
                    min={0}
                    step={tipoEconomico === 'porcentaje' ? '0.1' : '1'}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="label-erp mb-1 block">Observaciones</label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px]"
                placeholder="Notas internas opcionales…"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setOpen(false); reset(); }} disabled={pending}>
                Cancelar
              </Button>
              <Button onClick={submit} disabled={pending || !chofer}>
                {pending ? 'Guardando…' : 'Asignar chofer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Botón "Terminar contrato" + ConfirmDialog ──
function TerminateButton({ contratoId, choferNombre, expedienteSocioId }: ModeTerminate) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const res = await terminarChoferAction({
        contrato_id: contratoId,
        expediente_socio_id: expedienteSocioId,
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-target inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
        title="Terminar contrato del chofer"
      >
        <UserMinus size={14} /> Terminar
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        tone="warn"
        title={`¿Terminar contrato de ${choferNombre}?`}
        description="Se registrará la fecha de hoy como fin del contrato. El histórico se conserva."
        confirmLabel={pending ? 'Procesando…' : 'Sí, terminar contrato'}
        cancelLabel="No, mantener activo"
        loading={pending}
      />
    </>
  );
}

// ── Botón rápido: "El titular maneja esta unidad" ──
function MarkTitularButton({ concesionId, numeroConcesion, taxiNumero, expedienteSocioId }: ModeMarkTitular) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await asignarChoferAction({
        concesion_id: concesionId,
        chofer_socio_id: expedienteSocioId,
        rol: 'CHOFER',
        fecha_inicio: new Date().toISOString().slice(0, 10),
        observaciones: `Titular registrado como chofer de su propia unidad (${taxiNumero ? `Taxi #${taxiNumero}` : numeroConcesion}).`,
        expediente_socio_id: expedienteSocioId,
      });
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="primary"
        size="md"
        iconLeft={<UserPlus size={16} />}
        onClick={confirm}
        disabled={pending}
        className="w-full justify-center"
      >
        {pending ? 'Registrando…' : 'Sí, el titular maneja esta unidad'}
      </Button>
      {error && <p className="text-xs text-(--crit)">{error}</p>}
    </div>
  );
}

// ── Modal genérico ──
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl" role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold ink">{title}</h3>
          <button
            onClick={onClose}
            className="tap-target rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input } from '@erp/ui/primitives';
import { PolizaEstadoPill } from '@erp/ui/data';
import { Car, Shield, Pencil, Plus } from 'lucide-react';
import { fmtFechaCorta, estadoPolizaVigente } from '@erp/shared/formatters';
import type { Documento } from '@erp/db/queries/documentos';
import { guardarVehiculoAction, guardarPolizaAction } from '../flota-actions';
import DocumentosPanel from './DocumentosPanel';

type VehiculoEstatus = 'ACTIVO' | 'FUERA_SINDICATO' | 'BAJA' | 'SINIESTRADO';

export interface Vehiculo {
  id: string;
  placas: string | null; numero_serie: string | null;
  marca: string | null; modelo: string | null; anio: number | null;
  color: string | null; engomado: string | null;
  estatus: VehiculoEstatus; comentarios: string | null;
}
export interface Poliza {
  id: string;
  numero_poliza: string; compania: string; costo: number | null;
  fecha_inicio: string | null; fecha_vencimiento: string; endoso: string | null;
  estado: string; comentarios: string | null;
}

const s = (v: string | null | undefined) => v ?? '';

export default function VehiculoPolizaPanel({
  expedienteSocioId, concesionId, vehiculo, poliza, polizaDocumentos = [],
}: {
  expedienteSocioId: string;
  concesionId: string;
  vehiculo: Vehiculo | null;
  poliza: Poliza | null;
  polizaDocumentos?: Documento[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<'veh' | 'pol' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = () => { setModal(null); router.refresh(); };

  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3">
      {/* Vehículo */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="label-erp mb-1 flex items-center gap-1.5"><Car size={13} /> Vehículo</div>
          {vehiculo ? (
            <>
              <div className="mono font-medium text-slate-800">{vehiculo.placas ?? '— sin placas —'}</div>
              <div className="text-xs text-slate-500">{[vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(' ') || 'Sin datos'}</div>
            </>
          ) : (
            <div className="text-xs text-slate-400">Sin vehículo asignado</div>
          )}
        </div>
        <Button variant="ghost" size="sm" iconLeft={vehiculo ? <Pencil size={12} /> : <Plus size={12} />}
          onClick={() => { setError(null); setModal('veh'); }}>
          {vehiculo ? 'Editar' : 'Registrar'}
        </Button>
      </div>

      {/* Póliza */}
      <div className="mt-3 border-t border-slate-200 pt-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="label-erp mb-1 flex items-center gap-1.5"><Shield size={13} /> Póliza</div>
            {poliza ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="mono text-slate-700">{poliza.numero_poliza}</span>
                <span className="text-slate-500">{poliza.compania}</span>
                <span className="text-slate-500">vence {fmtFechaCorta(poliza.fecha_vencimiento)}</span>
                <PolizaEstadoPill estado={estadoPolizaVigente(poliza.fecha_vencimiento, poliza.estado)} />
              </div>
            ) : (
              <div className="text-xs text-slate-400">Sin póliza registrada</div>
            )}
          </div>
          {vehiculo && (
            <Button variant="ghost" size="sm" iconLeft={poliza ? <Pencil size={12} /> : <Plus size={12} />}
              onClick={() => { setError(null); setModal('pol'); }}>
              {poliza ? 'Editar' : 'Registrar'}
            </Button>
          )}
        </div>
        {poliza && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            <div className="label-erp mb-1">Documento de la póliza</div>
            <DocumentosPanel
              owner={{ tipo: 'poliza', id: poliza.id }}
              expedienteSocioId={expedienteSocioId}
              documentos={polizaDocumentos}
              compact
              defaultTipo="POLIZA"
            />
          </div>
        )}
      </div>

      {error && <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>}

      {modal === 'veh' && (
        <VehiculoModal expedienteSocioId={expedienteSocioId} concesionId={concesionId} vehiculo={vehiculo}
          onClose={() => setModal(null)} onSaved={done} onError={setError} />
      )}
      {modal === 'pol' && vehiculo && (
        <PolizaModal expedienteSocioId={expedienteSocioId} vehiculoId={vehiculo.id} poliza={poliza}
          onClose={() => setModal(null)} onSaved={done} onError={setError} />
      )}
    </div>
  );
}

function VehiculoModal({ expedienteSocioId, concesionId, vehiculo, onClose, onSaved, onError }: {
  expedienteSocioId: string; concesionId: string; vehiculo: Vehiculo | null;
  onClose: () => void; onSaved: () => void; onError: (m: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    placas: s(vehiculo?.placas), numero_serie: s(vehiculo?.numero_serie),
    marca: s(vehiculo?.marca), modelo: s(vehiculo?.modelo),
    anio: vehiculo?.anio != null ? String(vehiculo.anio) : '',
    color: s(vehiculo?.color), engomado: s(vehiculo?.engomado),
    estatus: (vehiculo?.estatus ?? 'ACTIVO') as VehiculoEstatus, comentarios: s(vehiculo?.comentarios),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function guardar() {
    startTransition(async () => {
      const r = await guardarVehiculoAction(expedienteSocioId, {
        placas: f.placas.trim().toUpperCase() || null, numero_serie: f.numero_serie.trim() || null,
        marca: f.marca.trim() || null, modelo: f.modelo.trim() || null,
        anio: f.anio ? Number(f.anio) : null, color: f.color.trim() || null,
        engomado: f.engomado.trim() || null, estatus: f.estatus, comentarios: f.comentarios.trim() || null,
      }, vehiculo ? { id: vehiculo.id } : { concesionId });
      if (r.ok) onSaved(); else onError(r.error);
    });
  }

  return (
    <Modal title={vehiculo ? 'Editar vehículo' : 'Registrar vehículo'} onClose={onClose} size="lg">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Placas" value={f.placas} onChange={(e) => set('placas', e.target.value.toUpperCase())} />
          <Input label="Número de serie (VIN)" value={f.numero_serie} onChange={(e) => set('numero_serie', e.target.value)} />
          <Input label="Marca" value={f.marca} onChange={(e) => set('marca', e.target.value)} />
          <Input label="Modelo" value={f.modelo} onChange={(e) => set('modelo', e.target.value)} />
          <Input label="Año" type="number" value={f.anio} onChange={(e) => set('anio', e.target.value)} />
          <Input label="Color" value={f.color} onChange={(e) => set('color', e.target.value)} />
          <Input label="Engomado" value={f.engomado} onChange={(e) => set('engomado', e.target.value)} />
          <label className="flex flex-col gap-1.5">
            <span className="label-erp">Estatus</span>
            <select value={f.estatus} onChange={(e) => set('estatus', e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[15px]">
              {(['ACTIVO', 'FUERA_SINDICATO', 'BAJA', 'SINIESTRADO'] as VehiculoEstatus[]).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
        <Input label="Comentarios" value={f.comentarios} onChange={(e) => set('comentarios', e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function PolizaModal({ expedienteSocioId, vehiculoId, poliza, onClose, onSaved, onError }: {
  expedienteSocioId: string; vehiculoId: string; poliza: Poliza | null;
  onClose: () => void; onSaved: () => void; onError: (m: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    numero_poliza: s(poliza?.numero_poliza), compania: s(poliza?.compania),
    costo: poliza?.costo != null ? String(poliza.costo) : '',
    fecha_inicio: s(poliza?.fecha_inicio), fecha_vencimiento: s(poliza?.fecha_vencimiento),
    endoso: s(poliza?.endoso), comentarios: s(poliza?.comentarios),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function guardar() {
    startTransition(async () => {
      const r = await guardarPolizaAction(expedienteSocioId, {
        numero_poliza: f.numero_poliza.trim(), compania: f.compania.trim(),
        costo: f.costo ? Number(f.costo) : null, fecha_inicio: f.fecha_inicio || null,
        fecha_vencimiento: f.fecha_vencimiento, endoso: f.endoso.trim() || null,
        comentarios: f.comentarios.trim() || null,
      }, poliza ? { id: poliza.id } : { vehiculoId });
      if (r.ok) onSaved(); else onError(r.error);
    });
  }

  return (
    <Modal title={poliza ? 'Editar póliza' : 'Registrar póliza'} onClose={onClose} size="lg">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Número de póliza *" value={f.numero_poliza} onChange={(e) => set('numero_poliza', e.target.value)} />
          <Input label="Compañía *" value={f.compania} onChange={(e) => set('compania', e.target.value)} />
          <Input label="Fecha de inicio" type="date" value={f.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} />
          <Input label="Fecha de vencimiento *" type="date" value={f.fecha_vencimiento} onChange={(e) => set('fecha_vencimiento', e.target.value)} />
          <Input label="Costo (MXN)" type="number" value={f.costo} onChange={(e) => set('costo', e.target.value)} />
          <Input label="Endoso" value={f.endoso} onChange={(e) => set('endoso', e.target.value)} />
        </div>
        <Input label="Comentarios" value={f.comentarios} onChange={(e) => set('comentarios', e.target.value)} />
        <p className="text-xs text-slate-500">El estado (vigente/por vencer/vencida) se calcula automáticamente según el vencimiento.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import { useRef, useState, useTransition } from 'react';
import { Badge, Button, ConfirmDialog } from '@erp/ui/primitives';
import { FileText, Image as ImageIcon, Upload, Eye, Trash2, Loader2, IdCard, Shield, ScrollText, CreditCard, FileCheck } from 'lucide-react';
import { fmtFechaCorta } from '@erp/shared/formatters';
import type { Documento, TipoDocumento } from '@erp/db/queries/documentos';
import {
  subirDocumentoAction,
  verDocumentoAction,
  eliminarDocumentoAction,
} from '../documentos-actions';

const TIPO_LABEL: Record<TipoDocumento, string> = {
  LICENCIA: 'Licencia', POLIZA: 'Póliza', TITULO_CONCESION: 'Título de concesión',
  INE: 'INE', CURP: 'CURP', ACTA_NACIMIENTO: 'Acta de nacimiento',
  COMP_DOMICILIO: 'Comp. de domicilio', FOTOGRAFIA: 'Fotografía', OTRO: 'Otro',
};

const TIPO_ICON: Partial<Record<TipoDocumento, React.ReactNode>> = {
  LICENCIA: <IdCard size={15} />, POLIZA: <Shield size={15} />, TITULO_CONCESION: <ScrollText size={15} />,
  INE: <CreditCard size={15} />, CURP: <FileCheck size={15} />, OTRO: <FileText size={15} />,
};

// Tipos ofrecidos como botón de acceso directo (los más comunes).
const TIPOS_COMUNES: TipoDocumento[] = ['LICENCIA', 'POLIZA', 'TITULO_CONCESION', 'INE', 'CURP', 'OTRO'];

// Campos que se capturan según el tipo (alimentan la ficha del documento).
function campos(tipo: TipoDocumento): { numero?: string; vigencia?: boolean } {
  switch (tipo) {
    case 'LICENCIA': return { numero: 'No. de licencia', vigencia: true };
    case 'POLIZA': return { numero: 'No. de póliza', vigencia: true };
    case 'TITULO_CONCESION': return { numero: 'No. de título', vigencia: false };
    case 'INE': return { numero: 'Clave de elector', vigencia: true };
    case 'CURP': return { numero: 'CURP', vigencia: false };
    default: return { vigencia: true };
  }
}

function fmtBytes(n: number | null): string {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export type OwnerTipo = 'socio' | 'concesion' | 'vehiculo' | 'poliza';

export default function DocumentosPanel({
  owner,
  expedienteSocioId,
  documentos,
  defaultTipo,
}: {
  owner: { tipo: OwnerTipo; id: string };
  expedienteSocioId: string;
  documentos: Documento[];
  compact?: boolean;
  defaultTipo?: TipoDocumento;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [viendo, setViendo] = useState<string | null>(null);
  const [aEliminar, setAEliminar] = useState<Documento | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Flujo de carga: se elige el tipo (un clic) → selector de archivo → captura de datos → guardar.
  const [tipoActivo, setTipoActivo] = useState<TipoDocumento | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [numero, setNumero] = useState('');
  const [vigencia, setVigencia] = useState('');

  const tiposBoton = defaultTipo ? [defaultTipo] : TIPOS_COMUNES;

  function elegirTipo(t: TipoDocumento) {
    setError(null);
    setTipoActivo(t);
    setArchivo(null);
    setNumero('');
    setVigencia('');
    // Abre el selector de archivo de inmediato.
    requestAnimationFrame(() => fileRef.current?.click());
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setArchivo(e.target.files?.[0] ?? null);
  }

  function cancelar() {
    setArchivo(null);
    setTipoActivo(null);
    setNumero('');
    setVigencia('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function guardar() {
    if (!archivo || !tipoActivo) return;
    setError(null);
    const fd = new FormData();
    fd.set('file', archivo);
    fd.set('tipo', tipoActivo);
    if (numero.trim()) fd.set('titulo', `${TIPO_LABEL[tipoActivo]} ${numero.trim()}`);
    if (vigencia) fd.set('vigencia', vigencia);
    fd.set('owner_tipo', owner.tipo);
    fd.set('owner_id', owner.id);
    fd.set('expediente_socio_id', expedienteSocioId);
    startTransition(async () => {
      const r = await subirDocumentoAction(fd);
      if (!r.ok) setError(r.error);
      else cancelar();
    });
  }

  async function ver(doc: Documento) {
    setViendo(doc.id);
    const r = await verDocumentoAction(doc.storage_path);
    setViendo(null);
    if (r.ok) window.open(r.url, '_blank', 'noopener,noreferrer');
    else setError(r.error);
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;
    setEliminando(true);
    const r = await eliminarDocumentoAction(aEliminar.id, expedienteSocioId);
    setEliminando(false);
    setAEliminar(null);
    if (!r.ok) setError(r.error ?? 'No se pudo eliminar el documento');
  }

  const cfg = tipoActivo ? campos(tipoActivo) : {};

  return (
    <div className="flex flex-col gap-4">
      {/* Botones por tipo — un clic abre el selector de imagen y ya queda clasificado */}
      <div>
        <div className="label-erp mb-1.5">{defaultTipo ? 'Cargar documento' : 'Cargar un documento'}</div>
        <div className="flex flex-wrap gap-2">
          {tiposBoton.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => elegirTipo(t)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              {TIPO_ICON[t] ?? <Upload size={15} />} {TIPO_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />

      {/* Tras elegir el archivo: captura de datos clave del documento */}
      {archivo && tipoActivo && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge tone="info">{TIPO_LABEL[tipoActivo]}</Badge>
            <span className="truncate text-slate-600">{archivo.name}</span>
            <span className="text-xs text-slate-400">({fmtBytes(archivo.size)})</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cfg.numero && (
              <label className="flex flex-col gap-1">
                <span className="label-erp">{cfg.numero}</span>
                <input value={numero} onChange={(e) => setNumero(e.target.value)}
                  className="h-9 rounded-md border border-slate-300 px-2 text-sm" placeholder="Opcional" />
              </label>
            )}
            {cfg.vigencia && (
              <label className="flex flex-col gap-1">
                <span className="label-erp">Vencimiento</span>
                <input type="date" value={vigencia} onChange={(e) => setVigencia(e.target.value)}
                  className="h-9 rounded-md border border-slate-300 px-2 text-sm" />
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={guardar} disabled={pending}
              iconLeft={pending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}>
              {pending ? 'Guardando…' : `Guardar ${TIPO_LABEL[tipoActivo].toLowerCase()}`}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelar} disabled={pending}>Cancelar</Button>
          </div>
        </div>
      )}

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Listado */}
      {documentos.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Sin documentos digitalizados aún.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100">
          {documentos.map((doc) => {
            const esImagen = (doc.mime ?? '').startsWith('image/');
            return (
              <li key={doc.id} className="flex items-center gap-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  {esImagen ? <ImageIcon size={18} /> : <FileText size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-800">
                      {doc.titulo || doc.nombre_original || TIPO_LABEL[doc.tipo]}
                    </span>
                    <Badge tone="info">{TIPO_LABEL[doc.tipo]}</Badge>
                    {doc.vigencia && (
                      <span className="text-xs text-slate-500">Vence {fmtFechaCorta(doc.vigencia)}</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {fmtBytes(doc.tamano_bytes)} · Subido {fmtFechaCorta(doc.created_at)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => ver(doc)} disabled={viendo === doc.id}
                    iconLeft={viendo === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}>
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setAEliminar(doc)}
                    className="text-red-600 hover:bg-red-50" iconLeft={<Trash2 size={14} />}>
                    Eliminar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={aEliminar !== null}
        onClose={() => setAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar documento"
        description={
          <>Se eliminará <strong>{aEliminar?.titulo || aEliminar?.nombre_original}</strong> del expediente y del almacenamiento. Esta acción no se puede deshacer.</>
        }
        confirmLabel="Eliminar"
        tone="danger"
        loading={eliminando}
      />
    </div>
  );
}

'use client';

import { useRef, useState, useTransition } from 'react';
import { Badge, Button, ConfirmDialog } from '@erp/ui/primitives';
import { FileText, Image as ImageIcon, Upload, Eye, Trash2, Loader2 } from 'lucide-react';
import { fmtFechaCorta } from '@erp/shared/formatters';
import type { Documento, TipoDocumento } from '@erp/db/queries/documentos';
import {
  subirDocumentoAction,
  verDocumentoAction,
  eliminarDocumentoAction,
} from '../documentos-actions';

const TIPOS: TipoDocumento[] = [
  'LICENCIA', 'POLIZA', 'TITULO_CONCESION', 'INE', 'CURP',
  'ACTA_NACIMIENTO', 'COMP_DOMICILIO', 'FOTOGRAFIA', 'OTRO',
];

const TIPO_LABEL: Record<TipoDocumento, string> = {
  LICENCIA: 'Licencia', POLIZA: 'Póliza', TITULO_CONCESION: 'Título de concesión',
  INE: 'INE', CURP: 'CURP', ACTA_NACIMIENTO: 'Acta de nacimiento',
  COMP_DOMICILIO: 'Comp. de domicilio', FOTOGRAFIA: 'Fotografía', OTRO: 'Otro',
};

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
  compact = false,
  defaultTipo,
}: {
  owner: { tipo: OwnerTipo; id: string };
  expedienteSocioId: string;
  documentos: Documento[];
  compact?: boolean;
  defaultTipo?: TipoDocumento;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [viendo, setViendo] = useState<string | null>(null);
  const [aEliminar, setAEliminar] = useState<Documento | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(!compact);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('owner_tipo', owner.tipo);
    fd.set('owner_id', owner.id);
    fd.set('expediente_socio_id', expedienteSocioId);
    startTransition(async () => {
      const r = await subirDocumentoAction(fd);
      if (!r.ok) setError(r.error);
      else {
        formRef.current?.reset();
        if (compact) setMostrarForm(false);
      }
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

  return (
    <div className="flex flex-col gap-4">
      {/* En modo compacto el formulario se colapsa tras un botón para no saturar */}
      {compact && !mostrarForm && (
        <button
          type="button"
          onClick={() => { setError(null); setMostrarForm(true); }}
          className="flex w-fit items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Upload size={14} /> Subir documento
        </button>
      )}

      {(mostrarForm || !compact) && (
        <form
          ref={formRef}
          onSubmit={onSubmit}
          className={`grid gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-[1fr_1fr_auto]'}`}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label-erp">Archivo (PDF, JPG, PNG, WebP · máx 15 MB)</label>
            <input
              type="file"
              name="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              required
              className="w-full min-w-0 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-300"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label-erp">Tipo de documento</label>
            <select name="tipo" required defaultValue={defaultTipo ?? ''} className="h-9 min-w-0 rounded-md border border-slate-300 px-2 text-sm">
              <option value="" disabled>Selecciona…</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{TIPO_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm" iconLeft={pending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} disabled={pending}>
              {pending ? 'Subiendo…' : 'Subir'}
            </Button>
            {compact && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setMostrarForm(false)} disabled={pending}>
                Cancelar
              </Button>
            )}
          </div>
          {!compact && (
            <>
              <div className="flex min-w-0 flex-col gap-1 md:col-span-1">
                <label className="label-erp">Título (opcional)</label>
                <input name="titulo" type="text" placeholder="Ej. Licencia 2026" className="h-9 min-w-0 rounded-md border border-slate-300 px-2 text-sm" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label className="label-erp">Vigencia (opcional)</label>
                <input name="vigencia" type="date" className="h-9 min-w-0 rounded-md border border-slate-300 px-2 text-sm" />
              </div>
            </>
          )}
        </form>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => ver(doc)}
                    disabled={viendo === doc.id}
                    iconLeft={viendo === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                  >
                    Ver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAEliminar(doc)}
                    className="text-red-600 hover:bg-red-50"
                    iconLeft={<Trash2 size={14} />}
                  >
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

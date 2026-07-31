'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, SearchBox, type SearchBoxOption } from '@erp/ui/primitives';
import { UserCog, UserX, ShieldCheck } from 'lucide-react';
import { getBrowserSupabase } from '@erp/db/client';
import { sugerirSocios } from '@erp/db/queries/socios';
import { asignarDelegadoAction } from '../actions';

export default function DelegadoCard({
  sitioId, delegadoNombre, delegadoCodigo,
}: {
  sitioId: string;
  delegadoNombre: string | null;
  delegadoCodigo: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quitando, setQuitando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function quitar() {
    setError(null);
    setQuitando(true);
    const r = await asignarDelegadoAction(sitioId, null);
    setQuitando(false);
    if (r.ok) router.refresh();
    else setError(r.error);
  }

  return (
    <div className="flex flex-col gap-3">
      {delegadoNombre ? (
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-slate-800">{delegadoNombre}</div>
            {delegadoCodigo && <div className="mono text-xs text-slate-500">{delegadoCodigo}</div>}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Este sitio no tiene delegado asignado.</p>
      )}

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" iconLeft={<UserCog size={14} />} onClick={() => { setError(null); setOpen(true); }}>
          {delegadoNombre ? 'Cambiar delegado' : 'Asignar delegado'}
        </Button>
        {delegadoNombre && (
          <Button variant="ghost" size="sm" iconLeft={<UserX size={14} />} onClick={quitar} disabled={quitando} className="text-red-600 hover:bg-red-50">
            {quitando ? 'Quitando…' : 'Quitar'}
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Al asignar un delegado, si tiene cuenta de usuario se le configura su rol con acceso solo a este sitio.
      </p>

      {open && (
        <AsignarModal
          sitioId={sitioId}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); router.refresh(); }}
          onError={setError}
        />
      )}
    </div>
  );
}

function AsignarModal({
  sitioId, onClose, onSaved, onError,
}: {
  sitioId: string;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [socio, setSocio] = useState<{ id: string; nombre: string } | null>(null);
  const [suggestions, setSuggestions] = useState<SearchBoxOption[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const sb = getBrowserSupabase();
      const sugs = await sugerirSocios(sb, query.trim());
      const seen = new Set<string>();
      const dedup = sugs.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
      setSuggestions(dedup.map((s) => ({ id: s.id, label: s.nombre, sublabel: s.sub, badge: s.badge, value: s.nombre })));
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function guardar() {
    if (!socio) { onError('Selecciona al socio que será delegado'); return; }
    startTransition(async () => {
      const r = await asignarDelegadoAction(sitioId, socio.id);
      if (r.ok) onSaved();
      else onError(r.error);
    });
  }

  return (
    <Modal title="Asignar delegado del sitio" onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        <SearchBox
          label="Buscar socio (por nombre, RFC o # escalafón)"
          placeholder="Empieza a escribir…"
          value={socio ? socio.nombre : query}
          onChange={(v) => { setSocio(null); setQuery(v); }}
          onClear={() => { setSocio(null); setQuery(''); }}
          onSelect={(opt) => { setSocio({ id: opt.id, nombre: opt.label }); setQuery(opt.label); setSuggestions([]); }}
          options={suggestions}
        />
        {socio && <p className="text-xs text-emerald-700">Seleccionado: <strong>{socio.nombre}</strong></p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={pending || !socio}>{pending ? 'Asignando…' : 'Asignar delegado'}</Button>
        </div>
      </div>
    </Modal>
  );
}

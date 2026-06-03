'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';

interface Evento {
  id: string;
  user_email: string | null;
  rol_activo: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  valor_antes: unknown;
  valor_despues: unknown;
  exito: boolean;
  error_mensaje: string | null;
  created_at: string;
}

interface Props {
  eventos: Evento[];
  filtros: { accion?: string; entidad?: string; user?: string };
}

export default function AuditoriaClient({ eventos, filtros }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [accion, setAccion] = useState(filtros.accion ?? '');
  const [entidad, setEntidad] = useState(filtros.entidad ?? '');
  const [user, setUser] = useState(filtros.user ?? '');

  function applyFilters() {
    const params = new URLSearchParams();
    if (accion) params.set('accion', accion);
    if (entidad) params.set('entidad', entidad);
    if (user) params.set('user', user);
    router.push(`/auditoria${params.toString() ? `?${params.toString()}` : ''}`);
  }
  function clearFilters() {
    setAccion(''); setEntidad(''); setUser('');
    router.push('/auditoria');
  }

  const hasFilters = accion || entidad || user;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Auditoría</h1>
        <p className="mt-1 text-sm text-(--dev-muted)">
          Log inmutable de acciones en el sistema. {eventos.length} eventos mostrados (últimos 200).
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-2">
        <FilterInput label="Acción" value={accion} onChange={setAccion} placeholder="UPDATE_MODULO" />
        <FilterInput label="Entidad" value={entidad} onChange={setEntidad} placeholder="usuarios_roles" />
        <FilterInput label="Usuario" value={user} onChange={setUser} placeholder="email contiene…" />
        <button
          onClick={applyFilters}
          className="rounded-lg bg-(--dev-accent) px-3 py-2 text-sm font-medium text-white hover:bg-red-600 flex items-center gap-1"
        >
          <Filter size={14} /> Aplicar
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="rounded-lg border border-(--dev-border) px-3 py-2 text-sm text-(--dev-muted) hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-(--dev-border) bg-(--dev-panel)">
        <table className="w-full text-sm">
          <thead className="border-b border-(--dev-border) text-left text-xs uppercase tracking-wider text-(--dev-muted)">
            <tr>
              <th className="px-3 py-2">Cuándo</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Acción</th>
              <th className="px-3 py-2">Entidad</th>
              <th className="px-3 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--dev-border)">
            {eventos.map((e) => (
              <>
                <tr
                  key={e.id}
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  className="cursor-pointer hover:bg-(--dev-bg)/40"
                >
                  <td className="px-3 py-2 text-xs mono text-(--dev-muted) whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString('es-MX')}
                  </td>
                  <td className="px-3 py-2 text-xs truncate max-w-[200px]">{e.user_email ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`mono text-xs ${e.exito ? 'text-emerald-300' : 'text-red-300'}`}>
                      {e.accion}
                    </span>
                  </td>
                  <td className="px-3 py-2 mono text-xs">{e.entidad}</td>
                  <td className="px-3 py-2 mono text-xs text-(--dev-muted) truncate max-w-[200px]">
                    {e.entidad_id ?? ''}
                  </td>
                </tr>
                {expanded === e.id && (
                  <tr key={e.id + '-detail'}>
                    <td colSpan={5} className="bg-(--dev-bg)/50 px-4 py-3">
                      {!e.exito && e.error_mensaje && (
                        <div className="mb-2 rounded border border-red-500/30 bg-red-500/5 px-2 py-1 text-xs text-red-300">
                          Error: {e.error_mensaje}
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Json title="Valor antes" data={e.valor_antes} />
                        <Json title="Valor después" data={e.valor_despues} />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {eventos.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-12 text-center text-(--dev-muted)">Sin eventos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-[10px] uppercase tracking-wider text-(--dev-muted)">{label}</label>
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--dev-muted)" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-lg border border-(--dev-border) bg-(--dev-panel) px-3 py-1.5 pl-7 text-xs text-white placeholder:text-(--dev-muted) focus:border-(--dev-accent) focus:outline-none"
        />
      </div>
    </div>
  );
}

function Json({ title, data }: { title: string; data: unknown }) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-(--dev-muted)">{title}</div>
      <pre className="overflow-x-auto rounded border border-(--dev-border) bg-(--dev-bg) p-2 text-[11px] mono text-(--dev-text)">
        {data ? JSON.stringify(data, null, 2) : 'null'}
      </pre>
    </div>
  );
}

'use client';

import { useState, useTransition, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, CardBody, CardHeader, Button, SearchBox,
  VistasRapidas, FilterSidebar,
  type SearchBoxOption, type VistaRapidaItem, type FilterGroup,
} from '@erp/ui/primitives';
import { DataTable } from '@erp/ui/data';
import { useRecentSearches } from '@erp/ui/hooks';
import {
  ExternalLink, X, Crown, IdCard, AlertTriangle, ShieldAlert,
  DollarSign, Car, MapPin, FileWarning, Calendar, AlertOctagon,
} from 'lucide-react';
import { fmtFechaCorta } from '@erp/shared/formatters';
import { getBrowserSupabase } from '@erp/db/client';
import { sugerirSocios } from '@erp/db/queries/socios';
import type { ChoferAlerta, ConteosChoferes } from '@erp/db/queries/choferes';

interface Filtros {
  q: string;
  tipo: string;        // '' | concesionario | solo_chofer
  sitio: string;       // '' | uuid
  licencia: string;    // '' | VENCIDA | URGENTE | PROXIMA | VIGENTE | SIN_REGISTRO
  antidoping: string;
  poliza: string;
  mens: string;        // '' | '1'
  acc: string;         // '' | '1'
}

interface Props {
  initialChoferes: ChoferAlerta[];
  total: number;
  pageSize: number;
  currentLimit: number;
  conteos: ConteosChoferes;
  sitios: { id: string; nombre: string }[];
  initialFilters: Filtros;
}

const PLACEHOLDER = 'Buscar por nombre, RFC, código AGR, # taxi o concesión…';
const DEBOUNCE_MS = 300;

const ESTADO_COLOR: Record<string, string> = {
  VENCIDA:      'text-red-700 bg-red-100',
  URGENTE:      'text-orange-800 bg-orange-100',
  PROXIMA:      'text-amber-800 bg-amber-100',
  VIGENTE:      'text-emerald-800 bg-emerald-100',
  SIN_REGISTRO: 'text-slate-500 bg-slate-100',
};
const ESTADO_LABEL: Record<string, string> = {
  VENCIDA:      'Vencida',
  URGENTE:      '≤ 7 días',
  PROXIMA:      '≤ 30 días',
  VIGENTE:      'Vigente',
  SIN_REGISTRO: 'Sin registro',
};

function EstadoPill({ estado }: { estado: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ESTADO_COLOR[estado] ?? ''}`}>
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  );
}

export default function ChoferesView({
  initialChoferes, total, pageSize, currentLimit, conteos, sitios, initialFilters,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filtros, setFiltros] = useState<Filtros>(initialFilters);
  const isInitialMount = useRef(true);
  const { recents, add: addRecent, remove: removeRecent } = useRecentSearches('choferes');

  const [suggestions, setSuggestions] = useState<SearchBoxOption[]>([]);
  useEffect(() => {
    const q = filtros.q.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    let cancel = false;
    const timer = setTimeout(async () => {
      const sb = getBrowserSupabase();
      const sugs = await sugerirSocios(sb, q);
      if (cancel) return;
      const seen = new Set<string>();
      const dedup = sugs.filter((s) => seen.has(s.id) ? false : (seen.add(s.id), true));
      setSuggestions(dedup.map((s) => ({
        id: s.id, label: s.nombre, sublabel: s.sub, badge: s.badge,
        value: s.nombre, href: `/padron/${s.id}`,
      })));
    }, 200);
    return () => { cancel = true; clearTimeout(timer); };
  }, [filtros.q]);

  function buildUrl(f: Filtros, limit?: number): string {
    const p = new URLSearchParams();
    if (f.q) p.set('q', f.q);
    if (f.tipo) p.set('tipo', f.tipo);
    if (f.sitio) p.set('sitio', f.sitio);
    if (f.licencia) p.set('licencia', f.licencia);
    if (f.antidoping) p.set('antidoping', f.antidoping);
    if (f.poliza) p.set('poliza', f.poliza);
    if (f.mens) p.set('mens', f.mens);
    if (f.acc) p.set('acc', f.acc);
    if (limit && limit !== pageSize) p.set('limit', String(limit));
    return `/choferes${p.toString() ? `?${p.toString()}` : ''}`;
  }

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    const t = setTimeout(() => {
      startTransition(() => router.push(buildUrl(filtros), { scroll: false }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  function setFiltro<K extends keyof Filtros>(k: K, v: Filtros[K]) {
    setFiltros((p) => ({ ...p, [k]: v }));
  }
  function limpiar() {
    setFiltros({ q: '', tipo: '', sitio: '', licencia: '', antidoping: '', poliza: '', mens: '', acc: '' });
  }
  function cargarMas() {
    startTransition(() => router.push(buildUrl(filtros, currentLimit + pageSize), { scroll: false }));
  }

  // ── Vistas rápidas: las alertas del día a día ──
  const vistas: VistaRapidaItem[] = useMemo(() => [
    {
      id: 'concesionarios', label: 'Concesionarios', description: 'Titulares que también manejan',
      icon: <Crown size={20} />, count: conteos.concesionarios, tone: 'success',
      active: filtros.tipo === 'concesionario',
      onClick: () => setFiltros({ ...filtros, tipo: 'concesionario' }),
    },
    {
      id: 'solo_chofer', label: 'Solo choferes', description: 'Empleados sin concesión',
      icon: <IdCard size={20} />, count: conteos.solo_chofer,
      active: filtros.tipo === 'solo_chofer',
      onClick: () => setFiltros({ ...filtros, tipo: 'solo_chofer' }),
    },
    {
      id: 'lic_venc', label: 'Licencia vencida', icon: <FileWarning size={20} />, tone: 'accent',
      count: conteos.licencia_vencida,
      active: filtros.licencia === 'VENCIDA',
      onClick: () => setFiltros({ ...filtros, licencia: 'VENCIDA' }),
    },
    {
      id: 'lic_pron', label: 'Licencia por vencer', icon: <Calendar size={20} />, tone: 'warn',
      count: conteos.licencia_porvencer,
      active: filtros.licencia === 'URGENTE' || filtros.licencia === 'PROXIMA',
    },
    {
      id: 'pol_venc', label: 'Póliza vencida', description: 'Vehículo sin seguro', icon: <ShieldAlert size={20} />, tone: 'accent',
      count: conteos.poliza_vencida,
      active: filtros.poliza === 'VENCIDA',
      onClick: () => setFiltros({ ...filtros, poliza: 'VENCIDA' }),
    },
    {
      id: 'mens', label: 'Mensualidades pendientes', icon: <DollarSign size={20} />, tone: 'warn',
      count: conteos.con_mensualidades,
      active: filtros.mens === '1',
      onClick: () => setFiltros({ ...filtros, mens: '1' }),
    },
    {
      id: 'acc', label: 'Accidentes pendientes', icon: <AlertOctagon size={20} />, tone: 'accent',
      count: conteos.con_accidentes,
      active: filtros.acc === '1',
      onClick: () => setFiltros({ ...filtros, acc: '1' }),
    },
  ], [conteos, filtros]);

  // ── Panel lateral ──
  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'tipo', label: 'Tipo de chofer',
      icon: <Crown size={16} />,
      type: 'radio',
      value: filtros.tipo || null,
      onChange: (v) => setFiltro('tipo', (v as string) ?? ''),
      options: [
        { value: 'concesionario', label: 'Concesionario', hint: 'Titular vigente que maneja' },
        { value: 'solo_chofer',   label: 'Solo chofer', hint: 'Empleado sin concesión' },
      ],
    },
    {
      id: 'sitio', label: 'Sitio',
      icon: <MapPin size={16} />,
      type: 'radio',
      value: filtros.sitio || null,
      onChange: (v) => setFiltro('sitio', (v as string) ?? ''),
      defaultCollapsed: true,
      options: sitios.map((s) => ({ value: s.id, label: s.nombre })),
    },
    {
      id: 'licencia', label: 'Licencia de conducir',
      icon: <FileWarning size={16} />,
      type: 'radio',
      value: filtros.licencia || null,
      onChange: (v) => setFiltro('licencia', (v as string) ?? ''),
      defaultCollapsed: true,
      options: [
        { value: 'VENCIDA',      label: 'Vencida' },
        { value: 'URGENTE',      label: 'Vence en ≤ 7 días' },
        { value: 'PROXIMA',      label: 'Vence en ≤ 30 días' },
        { value: 'VIGENTE',      label: 'Vigente' },
        { value: 'SIN_REGISTRO', label: 'Sin registro' },
      ],
    },
    {
      id: 'antidoping', label: 'Antidoping',
      icon: <AlertTriangle size={16} />,
      type: 'radio',
      value: filtros.antidoping || null,
      onChange: (v) => setFiltro('antidoping', (v as string) ?? ''),
      defaultCollapsed: true,
      options: [
        { value: 'VENCIDA',      label: 'Vencido' },
        { value: 'URGENTE',      label: 'Vence en ≤ 7 días' },
        { value: 'PROXIMA',      label: 'Vence en ≤ 30 días' },
        { value: 'VIGENTE',      label: 'Vigente' },
        { value: 'SIN_REGISTRO', label: 'Sin registro' },
      ],
    },
    {
      id: 'poliza', label: 'Póliza del vehículo',
      icon: <Car size={16} />,
      type: 'radio',
      value: filtros.poliza || null,
      onChange: (v) => setFiltro('poliza', (v as string) ?? ''),
      defaultCollapsed: true,
      options: [
        { value: 'VENCIDA',      label: 'Vencida' },
        { value: 'URGENTE',      label: 'Vence en ≤ 7 días' },
        { value: 'PROXIMA',      label: 'Vence en ≤ 30 días' },
        { value: 'VIGENTE',      label: 'Vigente' },
        { value: 'SIN_REGISTRO', label: 'Sin registro' },
      ],
    },
    {
      id: 'adeudos', label: 'Adeudos del chofer',
      icon: <DollarSign size={16} />,
      type: 'radio',
      value: filtros.mens === '1' ? 'mens' : filtros.acc === '1' ? 'acc' : null,
      onChange: (v) => {
        const val = (v as string) ?? '';
        setFiltros({ ...filtros, mens: val === 'mens' ? '1' : '', acc: val === 'acc' ? '1' : '' });
      },
      defaultCollapsed: true,
      options: [
        { value: 'mens', label: 'Con mensualidades pendientes' },
        { value: 'acc',  label: 'Con accidentes no liquidados' },
      ],
    },
  ], [filtros, sitios]);

  const activos = [filtros.tipo, filtros.sitio, filtros.licencia, filtros.antidoping, filtros.poliza, filtros.mens, filtros.acc].filter(Boolean).length;
  const hayFiltro = filtros.q.trim() !== '' || activos > 0;
  const hayMas = initialChoferes.length < total;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader
          title="Choferes"
          subtitle={
            hayFiltro
              ? `${initialChoferes.length.toLocaleString('es-MX')} de ${total.toLocaleString('es-MX')} coinciden`
              : `${conteos.total.toLocaleString('es-MX')} contratos activos`
          }
        />
        <CardBody>
          <SearchBox
            label="Buscar"
            placeholder={PLACEHOLDER}
            value={filtros.q}
            onChange={(v) => setFiltro('q', v)}
            onClear={() => setFiltro('q', '')}
            onSubmit={() => filtros.q.trim().length >= 2 && addRecent(filtros.q)}
            onSelect={(opt) => { if (opt.href) { addRecent(opt.label); router.push(opt.href); } }}
            options={suggestions}
            recents={recents}
            onRemoveRecent={removeRecent}
            loading={pending}
            shortcut="Ctrl+K"
          />
        </CardBody>
      </Card>

      <VistasRapidas title="Alertas y atajos" items={vistas} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        <FilterSidebar
          groups={filterGroups}
          activeCount={activos}
          onClearAll={limpiar}
        />

        <div className="flex min-w-0 flex-col gap-3">
          {hayFiltro && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-secondary">Aplicados:</span>
              {filtros.tipo && <Chip onRemove={() => setFiltro('tipo', '')}>{filtros.tipo === 'concesionario' ? 'Concesionarios' : 'Solo choferes'}</Chip>}
              {filtros.sitio && <Chip onRemove={() => setFiltro('sitio', '')}>Sitio: {sitios.find((s) => s.id === filtros.sitio)?.nombre ?? '?'}</Chip>}
              {filtros.licencia && <Chip onRemove={() => setFiltro('licencia', '')}>Licencia: {ESTADO_LABEL[filtros.licencia]}</Chip>}
              {filtros.antidoping && <Chip onRemove={() => setFiltro('antidoping', '')}>Antidoping: {ESTADO_LABEL[filtros.antidoping]}</Chip>}
              {filtros.poliza && <Chip onRemove={() => setFiltro('poliza', '')}>Póliza: {ESTADO_LABEL[filtros.poliza]}</Chip>}
              {filtros.mens === '1' && <Chip onRemove={() => setFiltro('mens', '')}>Mensualidades pend.</Chip>}
              {filtros.acc === '1' && <Chip onRemove={() => setFiltro('acc', '')}>Accidentes pend.</Chip>}
              {filtros.q && <Chip onRemove={() => setFiltro('q', '')}>“{filtros.q}”</Chip>}
              <Button variant="ghost" size="sm" onClick={limpiar} iconLeft={<X size={14} />}>
                Limpiar todo
              </Button>
            </div>
          )}

          <DataTable
            rows={initialChoferes}
            rowKey={(r) => r.contrato_id}
            loading={pending && initialChoferes.length === 0}
            empty={hayFiltro ? 'Sin resultados para los filtros actuales' : 'Sin contratos activos'}
            onRowClick={(r) => router.push(`/padron/${r.chofer_socio_id}`)}
            columns={[
              {
                key: 'taxi', header: '# Taxi',
                cell: (r) => (
                  <span className="mono font-bold text-slate-700 tabular-nums">
                    {r.taxi_numero != null ? `#${r.taxi_numero}` : '—'}
                  </span>
                ),
                className: 'w-20',
              },
              {
                key: 'chofer', header: 'Chofer',
                cell: (r) => (
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium ink">{r.chofer_nombre}</span>
                      {r.es_concesionario && (
                        <span title="También es concesionario titular vigente"><Crown size={14} className="shrink-0 text-amber-600" /></span>
                      )}
                    </div>
                    <div className="mono text-xs text-slate-500 truncate">
                      {r.chofer_codigo} {r.chofer_rfc ? ` · ${r.chofer_rfc}` : ''}
                    </div>
                  </div>
                ),
              },
              {
                key: 'sitio', header: 'Sitio',
                cell: (r) => <span className="text-sm text-slate-700 truncate">{r.sitio_nombre ?? '—'}</span>,
                hideOn: 'md',
              },
              {
                key: 'licencia', header: 'Licencia',
                cell: (r) => (
                  <div className="flex flex-col gap-0.5">
                    <EstadoPill estado={r.licencia_estado} />
                    {r.licencia_vence && (
                      <span className="text-[10px] text-slate-500">{fmtFechaCorta(r.licencia_vence)}</span>
                    )}
                  </div>
                ),
                hideOn: 'sm',
              },
              {
                key: 'poliza', header: 'Póliza',
                cell: (r) => (
                  <div className="flex flex-col gap-0.5">
                    <EstadoPill estado={r.poliza_estado} />
                    {r.poliza_vence && (
                      <span className="text-[10px] text-slate-500">{fmtFechaCorta(r.poliza_vence)}</span>
                    )}
                  </div>
                ),
                hideOn: 'md',
              },
              {
                key: 'adeudos', header: 'Adeudos',
                cell: (r) => {
                  const hay = r.mensualidades_pendientes > 0 || r.accidentes_pendientes > 0;
                  if (!hay) return <span className="text-xs text-slate-400">—</span>;
                  return (
                    <div className="flex flex-col gap-0.5 text-xs">
                      {r.mensualidades_pendientes > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <DollarSign size={11} /> {r.mensualidades_pendientes} mens.
                        </span>
                      )}
                      {r.accidentes_pendientes > 0 && (
                        <span className="inline-flex items-center gap-1 text-red-700">
                          <AlertOctagon size={11} /> {r.accidentes_pendientes} accid.
                        </span>
                      )}
                    </div>
                  );
                },
                hideOn: 'lg',
              },
              {
                key: 'open', header: '',
                cell: () => <ExternalLink size={16} className="text-slate-300" />,
                className: 'w-8',
              },
            ]}
          />

          {initialChoferes.length > 0 && (
            <div className="flex flex-col items-center gap-2 py-2 sm:flex-row sm:justify-between">
              <p className="text-sm text-slate-500">
                Mostrando <strong className="text-slate-700">{initialChoferes.length.toLocaleString('es-MX')}</strong>
                {hayMas && <> de <strong className="text-slate-700">{total.toLocaleString('es-MX')}</strong></>}
                {' '}{hayMas ? 'choferes' : 'choferes (todos)'}
              </p>
              {hayMas && (
                <Button variant="secondary" onClick={cargarMas} disabled={pending}>
                  {pending ? 'Cargando…' : `Cargar ${Math.min(pageSize, total - initialChoferes.length)} más`}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
      {children}
      <button type="button" onClick={onRemove} aria-label="Quitar filtro"
        className="rounded-full p-0.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900">
        <X size={12} />
      </button>
    </span>
  );
}

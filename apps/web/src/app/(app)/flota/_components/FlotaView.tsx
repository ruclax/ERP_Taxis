'use client';

import { useState, useTransition, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, CardBody, CardHeader, Badge, Button, SearchBox,
  VistasRapidas, FilterSidebar,
  type SearchBoxOption, type VistaRapidaItem, type FilterGroup,
} from '@erp/ui/primitives';
import { DataTable, PolizaEstadoPill } from '@erp/ui/data';
import { useRecentSearches } from '@erp/ui/hooks';
import {
  X, Car, CheckCircle, CarFront, AlertTriangle, UserMinus, Tag, CircleSlash,
} from 'lucide-react';
import { fmtFechaCorta } from '@erp/shared/formatters';
import { getBrowserSupabase } from '@erp/db/client';
import { sugerirVehiculos } from '@erp/db/queries/vehiculos';
import type { ConteosFlota } from '@erp/db/queries/vehiculos';

interface Vehiculo {
  id: string;
  placas: string | null;
  numero_serie: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  estatus: string;
  es_independiente: boolean;
  concesiones?: unknown;
  polizas?: { id: string; fecha_vencimiento: string; estado: string }[];
}

interface Filtros {
  q: string;
  estatus: string;
  marca: string;
  indep: string;
}

interface Props {
  initialVehiculos: Vehiculo[];
  total: number;
  pageSize: number;
  currentLimit: number;
  marcas: string[];
  conteos: ConteosFlota;
  initialFilters: Filtros;
}

const PLACEHOLDER = 'Placas, concesión, marca, modelo, VIN, año o titular…';
const DEBOUNCE_MS = 300;

function detectarTipo(q: string): string | null {
  const t = q.trim();
  if (!t) return null;
  if (/^27P+-\d{1,5}$/i.test(t)) return 'concesión';
  if (/^[A-Z]\d{2,3}[A-Z]{2,4}$/i.test(t)) return 'placas';
  if (/^[A-Z0-9]{10,17}$/i.test(t) && /[A-Z]/i.test(t) && /\d/.test(t)) return 'VIN';
  if (/^\d{4}$/.test(t)) return 'año';
  if (/^\d{1,3}$/.test(t)) return 'número (año o taxi)';
  return null;
}

export default function FlotaView({
  initialVehiculos, total, pageSize, currentLimit, marcas, conteos, initialFilters,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filtros, setFiltros] = useState<Filtros>(initialFilters);
  const isInitialMount = useRef(true);
  const { recents, add: addRecent, remove: removeRecent } = useRecentSearches('flota');

  const tipoDetectado = useMemo(() => detectarTipo(filtros.q), [filtros.q]);

  // ── Autocompletado ──
  const [suggestions, setSuggestions] = useState<SearchBoxOption[]>([]);
  useEffect(() => {
    const q = filtros.q.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    let cancel = false;
    const timer = setTimeout(async () => {
      const sb = getBrowserSupabase();
      const sugs = await sugerirVehiculos(sb, q);
      if (cancel) return;
      const seen = new Set<string>();
      const dedup = sugs.filter((s) => seen.has(s.id) ? false : (seen.add(s.id), true));
      setSuggestions(dedup.map((s) => ({
        id: s.id, label: s.placas, sublabel: s.sub, badge: s.badge, value: s.placas,
      })));
    }, 200);
    return () => { cancel = true; clearTimeout(timer); };
  }, [filtros.q]);

  function buildUrl(f: Filtros, limit?: number): string {
    const params = new URLSearchParams();
    if (f.q) params.set('q', f.q);
    if (f.estatus) params.set('estatus', f.estatus);
    if (f.marca) params.set('marca', f.marca);
    if (f.indep) params.set('indep', f.indep);
    if (limit && limit !== pageSize) params.set('limit', String(limit));
    return `/flota${params.toString() ? `?${params.toString()}` : ''}`;
  }

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(buildUrl(filtros), { scroll: false });
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  function setFiltro<K extends keyof Filtros>(key: K, value: Filtros[K]) {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }

  function limpiarFiltros() {
    setFiltros({ q: '', estatus: '', marca: '', indep: '' });
  }

  function cargarMas() {
    startTransition(() => {
      router.push(buildUrl(filtros, currentLimit + pageSize), { scroll: false });
    });
  }

  // ── Vistas rápidas ──
  const vistasItems: VistaRapidaItem[] = useMemo(() => {
    const isTodas = !filtros.estatus && !filtros.marca && !filtros.indep;
    return [
      {
        id: 'todas', label: 'Todas las unidades', icon: <Car size={20} />,
        count: conteos.todas, active: isTodas,
        onClick: () => setFiltros({ q: filtros.q, estatus: '', marca: '', indep: '' }),
      },
      {
        id: 'activas', label: 'En operación', description: 'Estatus ACTIVO',
        icon: <CheckCircle size={20} />, tone: 'success',
        count: conteos.activas,
        active: filtros.estatus === 'ACTIVO' && !filtros.marca && !filtros.indep,
        onClick: () => setFiltros({ q: filtros.q, estatus: 'ACTIVO', marca: '', indep: '' }),
      },
      {
        id: 'fuera', label: 'Fuera del sindicato', icon: <CarFront size={20} />, tone: 'warn',
        count: conteos.fuera,
        active: filtros.estatus === 'FUERA_SINDICATO',
        onClick: () => setFiltros({ q: filtros.q, estatus: 'FUERA_SINDICATO', marca: '', indep: '' }),
      },
      {
        id: 'siniestradas', label: 'Siniestradas', icon: <AlertTriangle size={20} />, tone: 'accent',
        count: conteos.siniestradas,
        active: filtros.estatus === 'SINIESTRADO',
        onClick: () => setFiltros({ q: filtros.q, estatus: 'SINIESTRADO', marca: '', indep: '' }),
      },
      {
        id: 'independientes', label: 'Independientes', description: 'Sin afiliación',
        icon: <UserMinus size={20} />, count: conteos.independientes,
        active: filtros.indep === '1',
        onClick: () => setFiltros({ q: filtros.q, estatus: '', marca: '', indep: '1' }),
      },
    ];
  }, [conteos, filtros]);

  // ── Panel lateral ──
  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'estatus', label: 'Estado de la unidad',
      icon: <CircleSlash size={16} />,
      type: 'radio',
      value: filtros.estatus || null,
      onChange: (v) => setFiltro('estatus', (v as string) ?? ''),
      options: [
        { value: 'ACTIVO',          label: 'En operación',       count: conteos.activas },
        { value: 'FUERA_SINDICATO', label: 'Fuera del sindicato', count: conteos.fuera },
        { value: 'SINIESTRADO',     label: 'Siniestradas',       count: conteos.siniestradas },
        { value: 'BAJA',            label: 'Baja',               count: conteos.baja },
      ],
    },
    {
      id: 'marca', label: 'Marca',
      icon: <Tag size={16} />,
      type: 'radio',
      value: filtros.marca || null,
      onChange: (v) => setFiltro('marca', (v as string) ?? ''),
      defaultCollapsed: true,
      options: marcas.map((m) => ({ value: m, label: m })),
    },
    {
      id: 'origen', label: 'Origen',
      icon: <UserMinus size={16} />,
      type: 'radio',
      value: filtros.indep || null,
      onChange: (v) => setFiltro('indep', (v as string) ?? ''),
      defaultCollapsed: true,
      options: [
        { value: '1', label: 'Solo independientes', count: conteos.independientes,
          hint: 'No pertenecen al sindicato' },
      ],
    },
  ], [filtros, conteos, marcas]);

  const filtrosActivos = [filtros.estatus, filtros.marca, filtros.indep].filter(Boolean).length;
  const hayFiltro = filtros.q.trim() !== '' || filtrosActivos > 0;
  const hayMas = initialVehiculos.length < total;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader
          title="Flota vehicular"
          subtitle={
            hayFiltro
              ? `${initialVehiculos.length.toLocaleString('es-MX')} de ${total.toLocaleString('es-MX')} coinciden`
              : `${total.toLocaleString('es-MX')} unidades registradas`
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
            onSelect={(opt) => { addRecent(opt.label); setFiltro('q', opt.value); }}
            options={suggestions}
            recents={recents}
            onRemoveRecent={removeRecent}
            loading={pending}
            hint={tipoDetectado ? `Buscando por ${tipoDetectado}…` : undefined}
            shortcut="Ctrl+K"
          />
        </CardBody>
      </Card>

      <VistasRapidas title="Vistas rápidas" items={vistasItems} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        <FilterSidebar
          groups={filterGroups}
          activeCount={filtrosActivos}
          onClearAll={limpiarFiltros}
        />

        <div className="flex min-w-0 flex-col gap-3">
          {hayFiltro && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-secondary">Aplicados:</span>
              {filtros.estatus && <Chip onRemove={() => setFiltro('estatus', '')}>Estado: {filtros.estatus}</Chip>}
              {filtros.marca && <Chip onRemove={() => setFiltro('marca', '')}>Marca: {filtros.marca}</Chip>}
              {filtros.indep === '1' && <Chip onRemove={() => setFiltro('indep', '')}>Independientes</Chip>}
              {filtros.q && <Chip onRemove={() => setFiltro('q', '')}>“{filtros.q}”</Chip>}
              <Button variant="ghost" size="sm" onClick={limpiarFiltros} iconLeft={<X size={14} />}>
                Limpiar todo
              </Button>
            </div>
          )}

          <DataTable
            rows={initialVehiculos}
            rowKey={(v) => v.id}
            loading={pending && initialVehiculos.length === 0}
            empty={hayFiltro ? 'Sin resultados para los filtros actuales' : 'Sin vehículos registrados'}
            columns={[
              {
                key: 'taxi', header: '# Económico',
                cell: (v) => {
                  const concRaw = (v as { concesiones?: unknown }).concesiones;
                  const c = Array.isArray(concRaw) ? concRaw[0] : concRaw;
                  const n = c ? (c as { taxi_numero?: number | null }).taxi_numero : null;
                  return (
                    <span className="mono font-bold text-slate-700 tabular-nums">
                      {n != null ? `#${n}` : '—'}
                    </span>
                  );
                },
                className: 'w-24',
              },
              {
                key: 'placas', header: 'Placas',
                cell: (v) => (
                  <span className="mono font-medium">
                    <HighlightedText text={v.placas ?? '—'} query={filtros.q} />
                  </span>
                ),
              },
              {
                key: 'marca', header: 'Marca / Modelo',
                cell: (v) => (
                  <div>
                    <div className="font-medium">
                      <HighlightedText text={v.marca ?? '—'} query={filtros.q} /> <HighlightedText text={v.modelo ?? ''} query={filtros.q} />
                    </div>
                    <div className="text-xs text-slate-500">{v.anio ?? '—'}</div>
                  </div>
                ),
              },
              {
                key: 'concesion', header: 'Concesión / Titular', hideOn: 'md',
                cell: (v) => {
                  const concRaw = (v as { concesiones?: unknown }).concesiones;
                  const c = Array.isArray(concRaw) ? concRaw[0] : concRaw;
                  if (!c) return <span className="text-slate-300">—</span>;
                  const socRaw = (c as { socios?: unknown }).socios;
                  const soc = Array.isArray(socRaw) ? socRaw[0] : socRaw;
                  return (
                    <div>
                      <div className="mono text-sm">
                        <HighlightedText text={(c as { numero_concesion: string }).numero_concesion} query={filtros.q} />
                      </div>
                      {soc != null && (
                        <div className="text-xs text-slate-500 truncate max-w-50">
                          <HighlightedText text={(soc as { nombre_completo: string }).nombre_completo} query={filtros.q} />
                        </div>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'serie', header: 'VIN', hideOn: 'lg',
                cell: (v) => (
                  <span className="mono text-xs text-slate-500">
                    <HighlightedText text={v.numero_serie ?? '—'} query={filtros.q} />
                  </span>
                ),
              },
              {
                key: 'poliza', header: 'Póliza',
                cell: (v) => {
                  const p = v.polizas?.[0];
                  return p ? (
                    <div className="flex flex-col gap-1">
                      <PolizaEstadoPill estado={p.estado} />
                      <span className="text-xs text-slate-500">{fmtFechaCorta(p.fecha_vencimiento)}</span>
                    </div>
                  ) : <span className="text-xs text-slate-400">Sin póliza</span>;
                },
              },
              {
                key: 'estatus', header: 'Estado',
                cell: (v) => (
                  <Badge tone={v.estatus === 'ACTIVO' ? 'success' : v.estatus === 'BAJA' ? 'critical' : 'warn'}>
                    {v.estatus}
                  </Badge>
                ),
              },
            ]}
          />

          {initialVehiculos.length > 0 && (
            <div className="flex flex-col items-center gap-2 py-2 sm:flex-row sm:justify-between">
              <p className="text-sm text-slate-500">
                Mostrando <strong className="text-slate-700">{initialVehiculos.length.toLocaleString('es-MX')}</strong>
                {hayMas && (<> de <strong className="text-slate-700">{total.toLocaleString('es-MX')}</strong></>)}
                {' '}{hayMas ? 'unidades' : 'unidades (todas)'}
              </p>
              {hayMas && (
                <Button variant="secondary" onClick={cargarMas} disabled={pending}>
                  {pending ? 'Cargando…' : `Cargar ${Math.min(pageSize, total - initialVehiculos.length)} más`}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q || q.length < 2) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200 text-slate-900 font-semibold rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar filtro"
        className="rounded-full p-0.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
      >
        <X size={12} />
      </button>
    </span>
  );
}

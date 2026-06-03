'use client';

import { useState, useTransition, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card, CardBody, CardHeader, Button, SearchBox, VistasRapidas, FilterSidebar,
  type SearchBoxOption, type VistaRapidaItem, type FilterGroup,
} from '@erp/ui/primitives';
import { DataTable, SocioEstatusPill } from '@erp/ui/data';
import { useRecentSearches } from '@erp/ui/hooks';
import {
  ExternalLink, X, Users, CheckCircle, Cross, Repeat,
  Award, UserMinus, PenLine, CircleSlash, UserPlus,
} from 'lucide-react';
import type { Socio } from '@erp/db';
import type { ConteosPadron } from '@erp/db/queries/socios';
import { fmtFechaCorta } from '@erp/shared/formatters';
import { getBrowserSupabase } from '@erp/db/client';
import { sugerirSocios } from '@erp/db/queries/socios';

interface Filtros {
  q: string;
  estatus: string;       // ACTIVO | FALLECIDO | BAJA_DEFINITIVA | NO_PERTENECE
  tipo: string;          // CONCESIONARIO | AGENCIA | ...
  cat: string;           // act | veint | tran
  firma: string;         // pendiente
}

interface Props {
  initialSocios: Socio[];
  total: number;
  pageSize: number;
  currentLimit: number;
  conteos: ConteosPadron;
  initialFilters: Filtros;
}

const PLACEHOLDER = 'Nombre, RFC, CURP, concesión, placas o # taxi…';
const DEBOUNCE_MS = 300;

function detectarTipo(q: string): string | null {
  const t = q.trim();
  if (!t) return null;
  if (/^27P+-\d{1,5}$/i.test(t)) return 'concesión';
  if (/^[A-Z]\d{2,3}[A-Z]{2,3}$/i.test(t)) return 'placas';
  if (/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{0,3}$/i.test(t) && t.length >= 10) {
    return t.length >= 17 ? 'CURP' : 'RFC';
  }
  if (/^\d{1,4}$/.test(t)) return 'número (taxi o escalafón)';
  return null;
}

export default function PadronView({
  initialSocios, total, pageSize, currentLimit, conteos, initialFilters,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filtros, setFiltros] = useState<Filtros>(initialFilters);
  const isInitialMount = useRef(true);
  const { recents, add: addRecent, remove: removeRecent } = useRecentSearches('padron');

  const tipoDetectado = useMemo(() => detectarTipo(filtros.q), [filtros.q]);

  // ── Autocompletado ──
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
    const params = new URLSearchParams();
    if (f.q) params.set('q', f.q);
    if (f.estatus) params.set('estatus', f.estatus);
    if (f.tipo) params.set('tipo', f.tipo);
    if (f.cat) params.set('cat', f.cat);
    if (f.firma) params.set('firma', f.firma);
    if (limit && limit !== pageSize) params.set('limit', String(limit));
    return `/padron${params.toString() ? `?${params.toString()}` : ''}`;
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
    setFiltros({ q: '', estatus: '', tipo: '', cat: '', firma: '' });
  }

  function cargarMas() {
    startTransition(() => {
      router.push(buildUrl(filtros, currentLimit + pageSize), { scroll: false });
    });
  }

  // ── Vistas rápidas (botones grandes) ──
  // Cada vista es un preset que setea varios filtros a la vez.
  const vistasItems: VistaRapidaItem[] = useMemo(() => {
    const isTodos = !filtros.estatus && !filtros.tipo && !filtros.cat && !filtros.firma;
    return [
      {
        id: 'todos',
        label: 'Todos los socios',
        icon: <Users size={20} />,
        count: conteos.todos,
        active: isTodos,
        onClick: () => setFiltros({ q: filtros.q, estatus: '', tipo: '', cat: '', firma: '' }),
      },
      {
        id: 'activos',
        label: 'Solo activos',
        description: 'Cobrables y vigentes',
        icon: <CheckCircle size={20} />,
        tone: 'success',
        count: conteos.activos,
        active: filtros.estatus === 'ACTIVO' && !filtros.tipo && !filtros.cat && !filtros.firma,
        onClick: () => setFiltros({ q: filtros.q, estatus: 'ACTIVO', tipo: '', cat: '', firma: '' }),
      },
      {
        id: 'firma-pend',
        label: 'Pendientes de firma',
        description: 'Acción requerida',
        icon: <PenLine size={20} />,
        tone: 'warn',
        count: conteos.firma_pendiente,
        active: filtros.firma === 'pendiente',
        onClick: () => setFiltros({ q: filtros.q, estatus: '', tipo: '', cat: '', firma: 'pendiente' }),
      },
      {
        id: 'veint',
        label: 'Veteranos 20+',
        description: 'SOC_VEINT',
        icon: <Award size={20} />,
        tone: 'success',
        count: conteos.soc_veint,
        active: filtros.cat === 'veint',
        onClick: () => setFiltros({ q: filtros.q, estatus: '', tipo: '', cat: 'veint', firma: '' }),
      },
      {
        id: 'tran',
        label: 'En transición',
        description: 'SOC_TRAN',
        icon: <Repeat size={20} />,
        count: conteos.soc_tran,
        active: filtros.cat === 'tran',
        onClick: () => setFiltros({ q: filtros.q, estatus: '', tipo: '', cat: 'tran', firma: '' }),
      },
      {
        id: 'fallecidos',
        label: 'Fallecidos',
        icon: <Cross size={20} />,
        tone: 'accent',
        count: conteos.fallecidos,
        active: filtros.estatus === 'FALLECIDO',
        onClick: () => setFiltros({ q: filtros.q, estatus: 'FALLECIDO', tipo: '', cat: '', firma: '' }),
      },
    ];
  }, [conteos, filtros]);

  // ── Grupos del panel lateral de filtros ──
  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'estatus',
      label: 'Estado del socio',
      icon: <CircleSlash size={16} />,
      type: 'radio',
      value: filtros.estatus || null,
      onChange: (v) => setFiltro('estatus', (v as string) ?? ''),
      options: [
        { value: 'ACTIVO',          label: 'Activos',         count: conteos.activos },
        { value: 'FALLECIDO',       label: 'Fallecidos',      count: conteos.fallecidos },
        { value: 'BAJA_DEFINITIVA', label: 'Baja definitiva', count: conteos.baja_definitiva },
        { value: 'BAJA_TEMPORAL',   label: 'Baja temporal',   count: conteos.baja_temporal,
          hint: 'Veremos / debe dinero' },
      ],
    },
    {
      id: 'tipo',
      label: 'Tipo de socio',
      icon: <UserMinus size={16} />,
      type: 'radio',
      value: filtros.tipo || null,
      onChange: (v) => setFiltro('tipo', (v as string) ?? ''),
      defaultCollapsed: true,
      options: [
        { value: 'CONCESIONARIO', label: 'Concesionario',  count: conteos.concesionarios },
        { value: 'AGENCIA',       label: 'Agencia',        count: conteos.agencia },
        { value: 'INDEPENDIENTE', label: 'Independiente',  count: conteos.independientes },
        { value: 'HEREDERO',      label: 'Heredero',       count: conteos.herederos },
      ],
    },
    {
      id: 'cat',
      label: 'Categoría sindical',
      icon: <Award size={16} />,
      type: 'radio',
      value: filtros.cat || null,
      onChange: (v) => setFiltro('cat', (v as string) ?? ''),
      defaultCollapsed: true,
      options: [
        { value: 'act',   label: 'Activo (SOC_ACT)',  count: conteos.soc_act },
        { value: 'veint', label: '20+ años (SOC_VEINT)', count: conteos.soc_veint },
        { value: 'tran',  label: 'Transición (SOC_TRAN)', count: conteos.soc_tran },
      ],
    },
    {
      id: 'firma',
      label: 'Firma actual',
      icon: <PenLine size={16} />,
      type: 'radio',
      value: filtros.firma || null,
      onChange: (v) => setFiltro('firma', (v as string) ?? ''),
      defaultCollapsed: true,
      options: [
        { value: 'pendiente', label: 'Solo pendientes', count: conteos.firma_pendiente,
          hint: 'No han firmado documento actual' },
      ],
    },
  ], [filtros, conteos]);

  const filtrosActivos = [filtros.estatus, filtros.tipo, filtros.cat, filtros.firma].filter(Boolean).length;
  const hayFiltro = filtros.q.trim() !== '' || filtrosActivos > 0;
  const hayMas = initialSocios.length < total;

  return (
    <div className="flex flex-col gap-5">
      {/* Encabezado + búsqueda */}
      <Card>
        <CardHeader
          title="Padrón de Socios"
          subtitle={
            hayFiltro
              ? `${initialSocios.length.toLocaleString('es-MX')} de ${total.toLocaleString('es-MX')} coinciden`
              : `${total.toLocaleString('es-MX')} socios registrados`
          }
          action={
            <Link
              href="/padron/nuevo"
              className="tap-target inline-flex items-center gap-2 rounded-lg bg-(--oxford) px-4 text-[15px] font-semibold text-white hover:bg-(--crit)"
            >
              <UserPlus size={18} /> Nuevo socio
            </Link>
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
            onSelect={(opt) => {
              if (opt.href) { addRecent(opt.label); router.push(opt.href); }
            }}
            options={suggestions}
            recents={recents}
            onRemoveRecent={removeRecent}
            loading={pending}
            hint={tipoDetectado ? `Buscando por ${tipoDetectado}…` : undefined}
            shortcut="Ctrl+K"
          />
        </CardBody>
      </Card>

      {/* Vistas rápidas */}
      <VistasRapidas title="Vistas rápidas" items={vistasItems} />

      {/* Layout: panel lateral + tabla */}
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
              {filtros.estatus && <Chip onRemove={() => setFiltro('estatus', '')}>Estatus: {filtros.estatus}</Chip>}
              {filtros.tipo && <Chip onRemove={() => setFiltro('tipo', '')}>Tipo: {filtros.tipo}</Chip>}
              {filtros.cat && <Chip onRemove={() => setFiltro('cat', '')}>Cat: {filtros.cat.toUpperCase()}</Chip>}
              {filtros.firma && <Chip onRemove={() => setFiltro('firma', '')}>Firma pendiente</Chip>}
              {filtros.q && <Chip onRemove={() => setFiltro('q', '')}>“{filtros.q}”</Chip>}
              <Button variant="ghost" size="sm" onClick={limpiarFiltros} iconLeft={<X size={14} />}>
                Limpiar todo
              </Button>
            </div>
          )}

          <DataTable
            rows={initialSocios}
            rowKey={(s) => s.id}
            loading={pending && initialSocios.length === 0}
            empty={hayFiltro ? 'Sin resultados para los filtros actuales' : 'Sin socios registrados'}
            onRowClick={(s) => router.push(`/padron/${s.id}`)}
            columns={[
              {
                key: 'escalafon', header: 'Escalafón',
                cell: (s) => {
                  const sx = s as { tipo_escalafon?: string; escalafon_numero?: number | null };
                  const t = sx.tipo_escalafon ?? 'NINGUNO';
                  const n = sx.escalafon_numero;
                  if (t === 'NINGUNO' || n == null) return <span className="text-slate-300 text-xs">—</span>;
                  const isAsp = t === 'ASPIRANTE';
                  return (
                    <span className={`mono inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${
                      isAsp ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isAsp ? 'Asp.' : 'Conc.'} #{n}
                    </span>
                  );
                },
                className: 'w-28',
              },
              {
                key: 'codigo', header: 'Código',
                cell: (s) => (
                  <span className="mono text-xs text-slate-500">
                    {(s as { codigo_agremiado?: string }).codigo_agremiado ?? '—'}
                  </span>
                ),
                className: 'w-24', hideOn: 'md',
              },
              {
                key: 'nombre', header: 'Nombre',
                cell: (s) => (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {s.nombre_completo.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium ink">
                        <HighlightedText text={s.nombre_completo} query={filtros.q} />
                      </div>
                      {s.rfc && (
                        <div className="mono text-xs text-slate-500 truncate">
                          <HighlightedText text={s.rfc} query={filtros.q} />
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'tipo', header: 'Tipo',
                cell: (s) => <span className="text-xs uppercase tracking-wide text-slate-500">{s.tipo_socio}</span>,
                hideOn: 'md',
              },
              {
                key: 'ingreso', header: 'Ingreso',
                cell: (s) => <span className="text-sm text-slate-500">{fmtFechaCorta(s.fecha_ingreso)}</span>,
                hideOn: 'lg',
              },
              {
                key: 'estatus', header: 'Estado',
                cell: (s) => <SocioEstatusPill estatus={s.estatus} />,
              },
              {
                key: 'flags', header: 'Marcas',
                cell: (s) => (
                  <div className="flex gap-1 text-[10px] uppercase">
                    {s.soc_act && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">Act</span>}
                    {s.soc_veint && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">20+</span>}
                    {s.soc_tran && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700">Tran</span>}
                  </div>
                ),
                hideOn: 'md',
              },
              {
                key: 'open', header: '',
                cell: () => <ExternalLink size={16} className="text-slate-300" />,
                className: 'w-8',
              },
            ]}
          />

          {initialSocios.length > 0 && (
            <div className="flex flex-col items-center gap-2 py-2 sm:flex-row sm:justify-between">
              <p className="text-sm text-slate-500">
                Mostrando <strong className="text-slate-700">{initialSocios.length.toLocaleString('es-MX')}</strong>
                {hayMas && <> de <strong className="text-slate-700">{total.toLocaleString('es-MX')}</strong></>}
                {' '}{hayMas ? 'socios' : 'socios (todos)'}
              </p>
              {hayMas && (
                <Button variant="secondary" onClick={cargarMas} disabled={pending}>
                  {pending ? 'Cargando…' : `Cargar ${Math.min(pageSize, total - initialSocios.length)} más`}
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

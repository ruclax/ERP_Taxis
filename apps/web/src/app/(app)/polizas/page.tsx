import { cookies } from 'next/headers';
import Link from 'next/link';
import { createSupabaseServer } from '@erp/db/client/server';
import { conteosVencimientos, listarPolizasVencimiento } from '@erp/db/queries/polizas';
import { Card, CardBody } from '@erp/ui/primitives';
import { fmtFechaCorta, diasParaVencer } from '@erp/shared/formatters';
import { Shield, ChevronRight } from 'lucide-react';

type SP = { vence?: string; vencidas?: string };

const VENTANAS = [10, 30, 60] as const;

export default async function PolizasPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const esVencidas = sp.vencidas === '1';
  const dias = VENTANAS.includes(Number(sp.vence) as (typeof VENTANAS)[number]) ? Number(sp.vence) : 30;

  const supabase = createSupabaseServer(await cookies());
  const [conteos, polizas] = await Promise.all([
    conteosVencimientos(supabase),
    listarPolizasVencimiento(supabase, esVencidas ? { vencidas: true } : { dias }),
  ]);

  const indicadores = [
    { key: 'vencidas', label: 'Vencidas', n: conteos.vencidas, href: '/polizas?vencidas=1', active: esVencidas, tone: 'critical' as const },
    { key: '10', label: '≤ 10 días', n: conteos.d10, href: '/polizas?vence=10', active: !esVencidas && dias === 10, tone: 'warn' as const },
    { key: '30', label: '≤ 30 días', n: conteos.d30, href: '/polizas?vence=30', active: !esVencidas && dias === 30, tone: 'warn' as const },
    { key: '60', label: '≤ 60 días', n: conteos.d60, href: '/polizas?vence=60', active: !esVencidas && dias === 60, tone: 'default' as const },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold ink">
          <Shield size={22} className="text-slate-400" /> Pólizas y seguros
        </h1>
        <p className="text-sm text-slate-500">Vigencias y renovaciones. Toca un indicador para filtrar.</p>
      </div>

      {/* Indicadores clicables */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {indicadores.map((ind) => (
          <Link
            key={ind.key}
            href={ind.href}
            aria-current={ind.active ? 'page' : undefined}
            className={`rounded-2xl border px-4 py-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              ind.active ? ACTIVE_CLS[ind.tone] : `bg-white hover:-translate-y-0.5 hover:shadow-md ${BORDER_CLS[ind.tone]}`
            }`}
          >
            <div className={`num text-3xl font-bold tabular-nums ${ind.active ? '' : VALUE_CLS[ind.tone]}`}>
              {ind.n.toLocaleString('es-MX')}
            </div>
            <div className={`mt-0.5 text-sm ${ind.active ? 'opacity-90' : 'text-slate-500'}`}>{ind.label}</div>
          </Link>
        ))}
      </div>

      {/* Lista */}
      <Card>
        <CardBody className="!p-0">
          {polizas.length === 0 ? (
            <p className="p-12 text-center text-slate-400">
              {esVencidas ? 'Sin pólizas vencidas 🎉' : `Sin pólizas que venzan en ${dias} días 🎉`}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {polizas.map((p) => {
                const pAny = p as unknown as {
                  id: string; numero_poliza: string | null; compania: string | null; fecha_vencimiento: string;
                  vehiculos: { id: string; placas: string | null; concesiones: unknown } | { id: string; placas: string | null; concesiones: unknown }[] | null;
                };
                const veh = Array.isArray(pAny.vehiculos) ? pAny.vehiculos[0] : pAny.vehiculos;
                const concRaw = (veh as { concesiones?: unknown } | undefined)?.concesiones;
                const conc = Array.isArray(concRaw) ? concRaw[0] : concRaw;
                const socRaw = (conc as { socios?: unknown } | undefined)?.socios;
                const soc = Array.isArray(socRaw) ? socRaw[0] : socRaw;
                const dv = diasParaVencer(pAny.fecha_vencimiento);
                const fila = (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-slate-700">
                        {(soc as { nombre_completo?: string } | undefined)?.nombre_completo ?? '—'}
                      </div>
                      <div className="mono text-xs text-slate-500">
                        {(conc as { numero_concesion?: string } | undefined)?.numero_concesion ?? '—'} · {veh?.placas ?? 'sin placas'}
                        {pAny.compania ? ` · ${pAny.compania}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="num text-sm text-slate-600">{fmtFechaCorta(pAny.fecha_vencimiento)}</div>
                      <div className={`num text-xs font-medium ${dv !== null && dv < 0 ? 'text-rose-600' : dv !== null && dv <= 15 ? 'text-amber-700' : 'text-slate-400'}`}>
                        {dv === null ? '—' : dv < 0 ? `vencida hace ${-dv} d` : `en ${dv} días`}
                      </div>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-slate-300" />
                  </div>
                );
                return (
                  <li key={pAny.id}>
                    {veh?.id ? (
                      <Link href={`/flota/${veh.id}`} className="block transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50">
                        {fila}
                      </Link>
                    ) : fila}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

const BORDER_CLS = { critical: 'border-rose-200', warn: 'border-amber-200', default: 'border-slate-200' };
const VALUE_CLS = { critical: 'text-rose-700', warn: 'text-amber-700', default: 'text-slate-900' };
const ACTIVE_CLS = {
  critical: 'border-rose-600 bg-rose-600 text-white',
  warn: 'border-amber-600 bg-amber-600 text-white',
  default: 'border-slate-800 bg-slate-800 text-white',
};

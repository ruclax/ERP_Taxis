import { cookies } from 'next/headers';
import Link from 'next/link';
import { createSupabaseServer } from '@erp/db/client/server';
import {
  statsGenerales, vencimientosProximos, distribucionPorSitio, pendientesAtencion,
  vencimientosPorMes, estadoPolizas, altasBajasPorMes,
} from '@erp/db/queries/dashboard';
import { conteosVencimientos } from '@erp/db/queries/polizas';
import { VencimientosPorMesChart, EstadoPolizasChart, AltasBajasChart } from './_components/DashboardCharts';
import PrimerosPasos from './_components/PrimerosPasos';
import { KpiCard } from '@erp/ui/data';
import { Card, CardBody, CardHeader, Badge } from '@erp/ui/primitives';
import {
  Users, Car, Shield, AlertTriangle, HeartHandshake,
  MapPin, IdCard, FileWarning, UserPlus, ChevronRight, ArrowRight,
} from 'lucide-react';
import { fmtFechaCorta, diasParaVencer } from '@erp/shared/formatters';

export default async function DashboardPage() {
  const supabase = createSupabaseServer(await cookies());
  const [stats, vencimientos, sitios, pend, porMes, estadoPol, altasBajas, conteosVenc] = await Promise.all([
    statsGenerales(supabase),
    vencimientosProximos(supabase, 30),
    distribucionPorSitio(supabase),
    pendientesAtencion(supabase),
    vencimientosPorMes(supabase, 6),
    estadoPolizas(supabase),
    altasBajasPorMes(supabase, 6),
    conteosVencimientos(supabase),
  ]);

  // Indicadores de vencimiento por ventana → llevan a la lista filtrada de Pólizas.
  const vencInd = [
    { key: 'vencidas', label: 'Vencidas', n: conteosVenc.vencidas, href: '/polizas?vencidas=1', tone: 'critical' as const },
    { key: '10', label: '≤ 10 días', n: conteosVenc.d10, href: '/polizas?vence=10', tone: 'warn' as const },
    { key: '30', label: '≤ 30 días', n: conteosVenc.d30, href: '/polizas?vence=30', tone: 'warn' as const },
    { key: '60', label: '≤ 60 días', n: conteosVenc.d60, href: '/polizas?vence=60', tone: 'default' as const },
  ];

  // Panel "Requiere atención" — solo lo que tiene pendientes, priorizado.
  const atencion = [
    { n: stats.polizas_vencidas, label: 'Pólizas vencidas', hint: 'Renovar cobertura', href: '/polizas', icon: <Shield size={18} />, tone: 'critical' as const },
    { n: pend.licencias_por_vencer, label: 'Licencias por vencer', hint: 'Próximos 30 días', href: '/choferes?licencia=POR_VENCER', icon: <IdCard size={18} />, tone: 'warn' as const },
    { n: stats.antidoping_alertas, label: 'Antidoping por vencer', hint: 'Revisar cumplimiento', href: '/choferes?antidoping=VENCIDA', icon: <AlertTriangle size={18} />, tone: 'warn' as const },
    { n: pend.sitios_sin_delegado, label: 'Sitios sin delegado', hint: 'Asignar responsable', href: '/sitios', icon: <MapPin size={18} />, tone: 'warn' as const },
    { n: pend.socios_sin_rfc, label: 'Socios sin RFC', hint: 'Completar expediente', href: '/padron', icon: <FileWarning size={18} />, tone: 'info' as const },
  ].filter((a) => a.n > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Accesos rápidos */}
      <div className="flex flex-wrap gap-2">
        <PrimerosPasos />
        <QuickAction href="/padron/nuevo" icon={<UserPlus size={16} />} label="Alta de socio" primary />
        <QuickAction href="/flota" icon={<Car size={16} />} label="Flota" />
        <QuickAction href="/sitios" icon={<MapPin size={16} />} label="Sitios" />
        <QuickAction href="/polizas" icon={<Shield size={16} />} label="Pólizas" />
      </div>

      {/* KPIs clicables */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KpiLink href="/padron">
          <KpiCard label="Socios" value={stats.socios.toLocaleString('es-MX')} hint={`${stats.socios_activos} activos`} icon={<Users size={20} />} />
        </KpiLink>
        <KpiLink href="/flota">
          <KpiCard label="Unidades" value={stats.vehiculos.toLocaleString('es-MX')} hint={`${stats.independientes} indep.`} icon={<Car size={20} />} />
        </KpiLink>
        <KpiLink href="/polizas">
          <KpiCard label="Alertas críticas" value={(stats.polizas_vencidas + stats.antidoping_alertas).toLocaleString('es-MX')} hint={`${stats.polizas_vencidas} pólizas vencidas`} icon={<AlertTriangle size={20} />} tone="critical" />
        </KpiLink>
        <KpiLink href="/polizas">
          <KpiCard label="Pólizas vigentes" value={stats.polizas_vigentes.toLocaleString('es-MX')} icon={<Shield size={20} />} tone="success" />
        </KpiLink>
        <KpiLink href="/flota">
          <KpiCard label="Concesiones" value={stats.concesiones.toLocaleString('es-MX')} icon={<HeartHandshake size={20} />} />
        </KpiLink>
      </div>

      {/* Requiere atención */}
      {atencion.length > 0 && (
        <Card>
          <CardHeader title="Requiere atención" subtitle="Pendientes accionables — toca para resolver." />
          <CardBody className="!p-0">
            <ul className="divide-y divide-slate-100">
              {atencion.map((a) => (
                <li key={a.label}>
                  <Link href={a.href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${TONE_ICON[a.tone]}`}>{a.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">{a.label}</div>
                      <div className="text-xs text-slate-500">{a.hint}</div>
                    </div>
                    <span className={`num shrink-0 text-lg font-bold tabular-nums ${TONE_TEXT[a.tone]}`}>{a.n.toLocaleString('es-MX')}</span>
                    <ChevronRight size={16} className="shrink-0 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Gráficas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Pólizas por vencer — próximos 6 meses" subtitle="Anticipa la carga de renovaciones." />
          <CardBody>
            <VencimientosPorMesChart data={porMes} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Estado de pólizas" />
          <CardBody>
            <EstadoPolizasChart data={estadoPol} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Altas y bajas del padrón" subtitle="Movimiento de socios en los últimos 6 meses." />
        <CardBody>
          <AltasBajasChart data={altasBajas} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Vencimientos próximos (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Vencimientos de pólizas"
            subtitle="Toca un indicador para ver la lista."
            action={<Link href="/polizas" className="text-sm font-medium text-blue-700 hover:underline">Ver todas →</Link>}
          />
          <CardBody className="!p-0">
            {/* Indicadores por ventana → lista filtrada */}
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
              {vencInd.map((ind) => (
                <Link
                  key={ind.key}
                  href={ind.href}
                  className={`rounded-xl border bg-white px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${VENC_BORDER[ind.tone]}`}
                >
                  <div className={`num text-2xl font-bold tabular-nums ${VENC_VALUE[ind.tone]}`}>{ind.n.toLocaleString('es-MX')}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{ind.label}</div>
                </Link>
              ))}
            </div>
            {vencimientos.length === 0 ? (
              <p className="px-4 pb-8 text-center text-sm text-slate-400">Sin vencimientos en 30 días 🎉</p>
            ) : (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {vencimientos.slice(0, 6).map((v) => {
                  const vAny = v as unknown as {
                    id: string; fecha_vencimiento: string;
                    vehiculos: { id: string; placas: string | null; concesiones: unknown } | { id: string; placas: string | null; concesiones: unknown }[] | null;
                  };
                  const veh = Array.isArray(vAny.vehiculos) ? vAny.vehiculos[0] : vAny.vehiculos;
                  const concRaw = (veh as { concesiones?: unknown } | undefined)?.concesiones;
                  const conc = Array.isArray(concRaw) ? concRaw[0] : concRaw;
                  const socRaw = (conc as { socios?: unknown } | undefined)?.socios;
                  const soc = Array.isArray(socRaw) ? socRaw[0] : socRaw;
                  const dv = diasParaVencer(v.fecha_vencimiento);
                  const urgente = dv !== null && dv <= 15;
                  const row = (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-slate-700">
                          {(soc as { nombre_completo?: string } | undefined)?.nombre_completo ?? '—'}
                        </div>
                        <div className="mono text-xs text-slate-500">
                          {(conc as { numero_concesion?: string } | undefined)?.numero_concesion ?? '—'} · {veh?.placas ?? '—'}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="num text-sm text-slate-600">{fmtFechaCorta(v.fecha_vencimiento)}</div>
                        <div className={`num text-xs font-medium ${urgente ? 'text-amber-700' : 'text-slate-400'}`}>
                          {dv !== null ? `en ${dv} días` : '—'}
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <li key={v.id}>
                      {veh?.id ? (
                        <Link href={`/flota/${veh.id}`} className="block transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50">
                          {row}
                        </Link>
                      ) : row}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Distribución por sitio (1/3) */}
        <Card>
          <CardHeader title="Distribución por sitio" subtitle="Concesiones vigentes" />
          <CardBody>
            {sitios.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Sin datos</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {sitios.slice(0, 8).map((s) => (
                  <li key={s.nombre}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate text-slate-700">{s.nombre}</span>
                      <span className="num font-medium text-slate-900">{s.n}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-(--ink)" style={{ width: `${Math.min(100, (s.n / sitios[0].n) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Estado del padrón */}
      <Card>
        <CardHeader title="Estado del padrón" />
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <Badge tone="success">{stats.socios_activos} activos</Badge>
            <Badge tone="info">{stats.socios - stats.socios_activos} históricos / bajas</Badge>
            <Badge tone="success">{stats.polizas_vigentes} pólizas vigentes</Badge>
            <Badge tone="critical">{stats.polizas_vencidas} pólizas vencidas</Badge>
            <Badge tone="warn">{stats.antidoping_alertas} antidoping por vencer</Badge>
            <Badge tone="neutral">{stats.independientes} concesiones independientes</Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

const VENC_BORDER: Record<'critical' | 'warn' | 'default', string> = {
  critical: 'border-rose-200',
  warn: 'border-amber-200',
  default: 'border-slate-200',
};
const VENC_VALUE: Record<'critical' | 'warn' | 'default', string> = {
  critical: 'text-rose-700',
  warn: 'text-amber-700',
  default: 'text-slate-900',
};

const TONE_ICON: Record<'critical' | 'warn' | 'info', string> = {
  critical: 'bg-rose-100 text-rose-700',
  warn: 'bg-amber-100 text-amber-700',
  info: 'bg-slate-100 text-slate-600',
};
const TONE_TEXT: Record<'critical' | 'warn' | 'info', string> = {
  critical: 'text-rose-700',
  warn: 'text-amber-700',
  info: 'text-slate-700',
};

function KpiLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 [&>*]:h-full [&>*]:group-hover:border-slate-300 [&>*]:group-hover:shadow-md"
    >
      {children}
    </Link>
  );
}

function QuickAction({ href, icon, label, primary }: { href: string; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
        primary
          ? 'bg-slate-800 text-white hover:bg-slate-900'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
      {primary && <ArrowRight size={14} className="opacity-80" />}
    </Link>
  );
}

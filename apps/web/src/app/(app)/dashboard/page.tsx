import { cookies } from 'next/headers';
import { createSupabaseServer } from '@erp/db/client/server';
import { statsGenerales, vencimientosProximos, distribucionPorSitio } from '@erp/db/queries/dashboard';
import { KpiCard } from '@erp/ui/data';
import { Card, CardBody, CardHeader, Badge } from '@erp/ui/primitives';
import { Users, Car, Shield, AlertTriangle, HeartHandshake } from 'lucide-react';
import { fmtFechaCorta, diasParaVencer } from '@erp/shared/formatters';

export default async function DashboardPage() {
  const supabase = createSupabaseServer(await cookies());
  const [stats, vencimientos, sitios] = await Promise.all([
    statsGenerales(supabase),
    vencimientosProximos(supabase, 60),
    distribucionPorSitio(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Socios"
          value={stats.socios.toLocaleString('es-MX')}
          hint={`${stats.socios_activos} activos`}
          icon={<Users size={20} />}
        />
        <KpiCard
          label="Unidades"
          value={stats.vehiculos.toLocaleString('es-MX')}
          hint={`${stats.independientes} indep.`}
          icon={<Car size={20} />}
        />
        <KpiCard
          label="Alertas críticas"
          value={(stats.polizas_vencidas + stats.antidoping_alertas).toLocaleString('es-MX')}
          hint={`${stats.polizas_vencidas} pólizas vencidas`}
          icon={<AlertTriangle size={20} />}
          tone="critical"
        />
        <KpiCard
          label="Pólizas vigentes"
          value={stats.polizas_vigentes.toLocaleString('es-MX')}
          icon={<Shield size={20} />}
          tone="success"
        />
        <KpiCard
          label="Concesiones"
          value={stats.concesiones.toLocaleString('es-MX')}
          icon={<HeartHandshake size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Vencimientos próximos (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Vencimientos próximos"
            subtitle="Pólizas que vencen en los próximos 60 días"
          />
          <CardBody className="!p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="label-erp px-4 py-3 text-left">Socio</th>
                  <th className="label-erp px-4 py-3 text-left hidden md:table-cell">Concesión</th>
                  <th className="label-erp px-4 py-3 text-left">Placas</th>
                  <th className="label-erp px-4 py-3 text-left">Vence</th>
                  <th className="label-erp px-4 py-3 text-right">Días</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vencimientos.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400">Sin vencimientos próximos</td></tr>
                ) : (
                  vencimientos.map((v) => {
                    const vAny = v as unknown as {
                      id: string;
                      fecha_vencimiento: string;
                      vehiculos: { placas: string | null; concesiones: { numero_concesion: string; socios: { nombre_completo: string } | { nombre_completo: string }[] | null } | { numero_concesion: string; socios: { nombre_completo: string } | { nombre_completo: string }[] | null }[] | null } | { placas: string | null; concesiones: { numero_concesion: string; socios: { nombre_completo: string } | { nombre_completo: string }[] | null } | { numero_concesion: string; socios: { nombre_completo: string } | { nombre_completo: string }[] | null }[] | null }[] | null;
                    };
                    const vehRaw = vAny.vehiculos;
                    const veh = Array.isArray(vehRaw) ? vehRaw[0] : vehRaw;
                    const concRaw = veh?.concesiones;
                    const conc = Array.isArray(concRaw) ? concRaw[0] : concRaw;
                    const socRaw = conc?.socios;
                    const soc = Array.isArray(socRaw) ? socRaw[0] : socRaw;
                    const dias = diasParaVencer(v.fecha_vencimiento);
                    return (
                      <tr key={v.id}>
                        <td className="px-4 py-3 text-slate-700 truncate max-w-[260px]">
                          {soc?.nombre_completo ?? '—'}
                        </td>
                        <td className="px-4 py-3 mono text-slate-600 hidden md:table-cell">
                          {conc?.numero_concesion ?? '—'}
                        </td>
                        <td className="px-4 py-3 mono">{veh?.placas ?? '—'}</td>
                        <td className="px-4 py-3 num">{fmtFechaCorta(v.fecha_vencimiento)}</td>
                        <td className={`px-4 py-3 num text-right ${dias !== null && dias < 0 ? 'crit font-semibold' : ''}`}>
                          {dias !== null ? (dias < 0 ? `${dias}` : `${dias}`) : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* Distribución por sitio (1/3) */}
        <Card>
          <CardHeader title="Distribución por sitio" subtitle="Concesiones vigentes" />
          <CardBody>
            {sitios.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">Sin datos</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {sitios.slice(0, 8).map((s) => (
                  <li key={s.nombre}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate text-slate-700">{s.nombre}</span>
                      <span className="num font-medium text-slate-900">{s.n}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-(--ink)"
                        style={{ width: `${Math.min(100, (s.n / sitios[0].n) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Resumen de estado */}
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

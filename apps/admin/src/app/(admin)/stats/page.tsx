import { createSupabaseServiceRole } from '@/lib/supabase-server';
import { Activity, Users, Database, AlertTriangle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const svc = createSupabaseServiceRole();

  // Conteos paralelos
  const [
    { count: usuarios },
    { count: socios },
    { count: concesiones },
    { count: vehiculos },
    { count: polizas },
    { count: auditoriaRows },
    { count: superadmins },
  ] = await Promise.all([
    svc.from('usuarios_perfil').select('*', { count: 'exact', head: true }),
    svc.from('socios').select('*', { count: 'exact', head: true }),
    svc.from('concesiones').select('*', { count: 'exact', head: true }),
    svc.from('vehiculos').select('*', { count: 'exact', head: true }),
    svc.from('polizas').select('*', { count: 'exact', head: true }),
    svc.from('auditoria').select('*', { count: 'exact', head: true }),
    svc.from('usuarios_roles').select('*', { count: 'exact', head: true }).eq('rol_codigo', 'superadmin').eq('activo', true),
  ]);

  type AuditRow = { id: string; accion: string; entidad: string; user_email: string | null; created_at: string; exito: boolean };
  const { data: recentAuditRaw } = await svc
    .from('auditoria')
    .select('id, accion, entidad, user_email, created_at, exito')
    .order('created_at', { ascending: false })
    .limit(8);
  const recentAudit = (recentAuditRaw ?? []) as unknown as AuditRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Stats del Sistema</h1>
        <p className="mt-1 text-sm text-(--dev-muted)">Vista general del estado de la plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Usuarios" value={usuarios ?? 0} icon={<Users size={18} />} />
        <Kpi label="Socios" value={socios ?? 0} icon={<Activity size={18} />} />
        <Kpi label="Concesiones" value={concesiones ?? 0} icon={<Database size={18} />} />
        <Kpi label="Vehículos" value={vehiculos ?? 0} icon={<Database size={18} />} />
        <Kpi label="Pólizas" value={polizas ?? 0} icon={<Database size={18} />} />
        <Kpi label="Superadmins" value={superadmins ?? 0} icon={<AlertTriangle size={18} />} accent />
        <Kpi label="Eventos auditoría" value={auditoriaRows ?? 0} icon={<Clock size={18} />} />
        <Kpi label="DB región" value="us-west-1" icon={<Database size={18} />} small />
      </div>

      {/* Eventos recientes */}
      <Panel title="Eventos recientes en auditoría">
        {recentAudit && recentAudit.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--dev-border) text-left text-xs uppercase tracking-wider text-(--dev-muted)">
                <th className="py-2 pr-4">Cuándo</th>
                <th className="py-2 pr-4">Usuario</th>
                <th className="py-2 pr-4">Acción</th>
                <th className="py-2 pr-4">Entidad</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--dev-border)">
              {recentAudit.map((e) => (
                <tr key={e.id}>
                  <td className="py-2 pr-4 text-xs text-(--dev-muted) mono">
                    {new Date(e.created_at).toLocaleString('es-MX')}
                  </td>
                  <td className="py-2 pr-4 truncate max-w-[200px]">{e.user_email ?? '—'}</td>
                  <td className="py-2 pr-4 mono text-xs">{e.accion}</td>
                  <td className="py-2 pr-4 mono text-xs">{e.entidad}</td>
                  <td className="py-2">
                    {e.exito ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-(--dev-muted)">Sin eventos registrados aún.</p>
        )}
      </Panel>
    </div>
  );
}

function Kpi({
  label, value, icon, accent, small,
}: { label: string; value: number | string; icon: React.ReactNode; accent?: boolean; small?: boolean }) {
  return (
    <div className={`rounded-lg border border-(--dev-border) bg-(--dev-panel) px-4 py-3 ${accent ? 'ring-1 ring-(--dev-accent)/30' : ''}`}>
      <div className="flex items-center justify-between text-(--dev-muted)">
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={`mt-1 font-bold text-white ${small ? 'text-base mono' : 'text-2xl tabular-nums'}`}>
        {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-(--dev-border) bg-(--dev-panel)">
      <div className="border-b border-(--dev-border) px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

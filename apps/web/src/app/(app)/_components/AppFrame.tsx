'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell, Sidebar, TopBar } from '@erp/ui/layout';
import { ROLES, ROL_CODIGOS, type Modulo, rolPuedeVer, rolSoloLectura } from '@erp/auth/rbac';
import type { RolCodigo } from '@erp/db';
import { MODULO_LABELS } from '@erp/shared/constants';
import { getBrowserSupabase } from '@erp/db/client';
import {
  LayoutDashboard, Users, Car, IdCard, Shield,
  HeartHandshake, Wallet, AlertOctagon, Gavel, ClipboardList, LogOut, User,
  Eye, ExternalLink, ChevronDown, Settings, MapPin,
} from 'lucide-react';

interface RolInfo {
  rolCodigo: RolCodigo;
  scopeSitioId: string | null;
  scopeAreaNum: number | null;
  suplente: boolean;
}

// Estructura agrupada de módulos por dominio.
// La agrupación es UNO de los principios clave: el usuario escanea más rápido
// cuando puede inferir la categoría de cada módulo.
type NavGroup = { label?: string; items: Array<{ key: Modulo; icon: React.ReactNode; href: string }> };

const NAV_GROUPS: NavGroup[] = [
  {
    // Sin label: zona "personal" del usuario, va sin etiqueta al principio
    items: [
      { key: 'mipanel',   icon: <User size={18} />,           href: '/mipanel' },
      { key: 'dashboard', icon: <LayoutDashboard size={18} />, href: '/dashboard' },
    ],
  },
  {
    label: 'Operación',
    items: [
      { key: 'padron',     icon: <Users size={18} />,      href: '/padron' },
      { key: 'flota',      icon: <Car size={18} />,        href: '/flota' },
      { key: 'choferes',   icon: <IdCard size={18} />,     href: '/choferes' },
      { key: 'sitios',     icon: <MapPin size={18} />,     href: '/sitios' },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { key: 'polizas',   icon: <Shield size={18} />,        href: '/polizas' },
      { key: 'tesoreria', icon: <Wallet size={18} />,        href: '/tesoreria' },
      { key: 'funerario', icon: <HeartHandshake size={18} />, href: '/funerario' },
    ],
  },
  {
    label: 'Gobernanza',
    items: [
      { key: 'bitacora',  icon: <AlertOctagon size={18} />,  href: '/bitacora' },
      { key: 'asambleas', icon: <ClipboardList size={18} />, href: '/asambleas' },
      { key: 'honor',     icon: <Gavel size={18} />,         href: '/honor' },
    ],
  },
];

const PERSPECTIVA_KEY = 'erp.perspectivaRol';

// URL del panel admin (app separada). En producción debe venir de env;
// en desarrollo cae a localhost. Si no hay valor en prod, el link no se muestra.
const adminUrl =
  process.env.NEXT_PUBLIC_ADMIN_URL ??
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:3001' : null);

export interface AppFrameProps {
  nombreDisplay: string;
  esSuperadmin: boolean;
  roles: RolInfo[];
  /** Módulos visibles por rol, desde la BD (tabla `roles`). Fuente de verdad del menú. */
  modulosPorRol?: Record<string, string[]>;
  children: React.ReactNode;
}

export function AppFrame({ nombreDisplay, esSuperadmin, roles, modulosPorRol, children }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const rolesSindicales = useMemo(
    () => roles.filter((r) => (r.rolCodigo as string) !== 'superadmin'),
    [roles]
  );

  const [perspectivaRol, setPerspectivaRol] = useState<RolCodigo | null>(null);
  useEffect(() => {
    if (!esSuperadmin) return;
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(PERSPECTIVA_KEY) : null;
    if (stored && (ROL_CODIGOS as string[]).includes(stored)) {
      setPerspectivaRol(stored as RolCodigo);
    } else {
      setPerspectivaRol('sec_general');
    }
  }, [esSuperadmin]);

  function cambiarPerspectiva(codigo: RolCodigo) {
    setPerspectivaRol(codigo);
    if (typeof window !== 'undefined') window.localStorage.setItem(PERSPECTIVA_KEY, codigo);
  }

  const activeRol: RolCodigo | undefined = esSuperadmin
    ? (perspectivaRol ?? 'sec_general')
    : rolesSindicales[0]?.rolCodigo;
  const activeRolDef = activeRol ? ROLES[activeRol] : null;

  // Visibilidad de módulos: la BD (modulosPorRol) es la fuente de verdad;
  // si el rol no viene en el catálogo, se cae a la matriz estática de rbac.ts.
  const puedeVer = useMemo(() => {
    return (modulo: Modulo): boolean => {
      if (!activeRol) return false;
      const desdeBd = modulosPorRol?.[activeRol];
      if (desdeBd) return desdeBd.includes(modulo);
      return rolPuedeVer(activeRol, modulo);
    };
  }, [activeRol, modulosPorRol]);

  // Construye grupos filtrados por rol
  const filteredGroups = useMemo(() => {
    return NAV_GROUPS.map((g) => ({
      label: g.label,
      items: g.items.filter((i) => puedeVer(i.key)),
    })).filter((g) => g.items.length > 0);
  }, [puedeVer]);

  const currentKey: Modulo = useMemo(() => {
    for (const g of filteredGroups) {
      for (const i of g.items) {
        if (pathname.startsWith(i.href)) return i.key;
      }
    }
    return 'dashboard';
  }, [filteredGroups, pathname]);

  const currentItem = filteredGroups.flatMap((g) => g.items).find((i) => i.key === currentKey);

  async function logout() {
    const sb = getBrowserSupabase();
    await sb.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <AppShell
      sidebar={
        <Sidebar open={open} onClose={() => setOpen(false)}>
          <Sidebar.Brand
            name="Taxi ERP"
            subtitle="Sindicato Nvo. Laredo"
            logoText="TX"
            onClose={() => setOpen(false)}
          />

          <Sidebar.Nav>
            {filteredGroups.map((group, idx) => (
              <Sidebar.Group key={idx} label={group.label}>
                {group.items.map((item) => {
                  const active = item.key === currentKey;
                  const ro = rolSoloLectura(activeRol, item.key);
                  return (
                    <Sidebar.Item key={item.key} asChild>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block focus:outline-none"
                        aria-current={active ? 'page' : undefined}
                      >
                        <Sidebar.ItemContent
                          icon={item.icon}
                          label={MODULO_LABELS[item.key] ?? item.key}
                          active={active}
                          readOnly={ro}
                        />
                      </Link>
                    </Sidebar.Item>
                  );
                })}
              </Sidebar.Group>
            ))}
          </Sidebar.Nav>

          <Sidebar.Footer>
            <Sidebar.UserBlock
              name={nombreDisplay}
              subtitle={activeRolDef?.nombre}
              avatarColor={esSuperadmin ? '#b91c1c' : '#475569'}
            />
            <div className="border-t border-slate-800/60">
              {esSuperadmin && adminUrl && (
                <Sidebar.Action
                  icon={<ExternalLink size={14} />}
                  label="Abrir panel admin"
                  href={adminUrl}
                  tone="accent"
                />
              )}
              <Sidebar.Action
                icon={<Settings size={14} />}
                label="Configuración"
                href="/mipanel"
              />
              <Sidebar.Action
                icon={<LogOut size={14} />}
                label="Cerrar sesión"
                onClick={logout}
              />
            </div>
          </Sidebar.Footer>
        </Sidebar>
      }
      topBar={
        <TopBar
          title={currentItem ? (MODULO_LABELS[currentItem.key] ?? currentItem.key) : 'Taxi ERP'}
          subtitle={activeRolDef?.nombre}
          breadcrumbs={[{ label: 'Taxi ERP', href: '/dashboard' }, { label: currentItem ? (MODULO_LABELS[currentItem.key] ?? '') : '' }]}
          onMenuClick={() => setOpen(true)}
          actions={
            esSuperadmin && (
              <PerspectivaSelector value={activeRol ?? 'sec_general'} onChange={cambiarPerspectiva} />
            )
          }
        />
      }
    >
      {esSuperadmin && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <Eye size={14} aria-hidden="true" />
          <span>
            <strong>Modo perspectiva (superadmin)</strong> — viendo como <strong>{activeRolDef?.nombre ?? 'rol'}</strong>.
            Cambia el rol en la barra superior.
          </span>
        </div>
      )}
      {children}
    </AppShell>
  );
}

function PerspectivaSelector({ value, onChange }: { value: RolCodigo; onChange: (v: RolCodigo) => void }) {
  const [open, setOpen] = useState(false);
  const def = ROLES[value];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Eye size={12} aria-hidden="true" />
        <span className="hidden sm:inline">Ver como:</span>
        <span className="font-semibold">{def?.nombre ?? value}</span>
        <ChevronDown size={12} aria-hidden="true" />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30"
          />
          <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500">
              Cambiar perspectiva
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {ROL_CODIGOS.map((codigo) => {
                const r = ROLES[codigo];
                const activo = codigo === value;
                return (
                  <li key={codigo}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={activo}
                      onClick={() => { onChange(codigo); setOpen(false); }}
                      className={`block w-full rounded px-3 py-2 text-left text-sm ${
                        activo ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium">{r.nombre}</div>
                      <div className="truncate text-[11px] text-slate-500">{r.persona}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

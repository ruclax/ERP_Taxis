'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import {
  Activity, Users, Lock, ToggleRight, FileText, Terminal,
  Eye, PlayCircle, Database, Palette, LogOut, AlertTriangle, Menu, X, Shield,
} from 'lucide-react';

const NAV: { href: string; label: string; icon: React.ReactNode; danger?: boolean }[] = [
  { href: '/stats',       label: 'Stats',       icon: <Activity size={16} /> },
  { href: '/usuarios',    label: 'Usuarios',    icon: <Users size={16} /> },
  { href: '/roles',       label: 'Roles',       icon: <Lock size={16} /> },
  { href: '/modulos',     label: 'Módulos',     icon: <ToggleRight size={16} /> },
  { href: '/auditoria',   label: 'Auditoría',   icon: <FileText size={16} /> },
  { href: '/sql',         label: 'SQL Console', icon: <Terminal size={16} />, danger: true },
  { href: '/impersonar',  label: 'Impersonar',  icon: <Eye size={16} />, danger: true },
  { href: '/jobs',        label: 'Jobs',        icon: <PlayCircle size={16} /> },
  { href: '/backup',      label: 'Backup',      icon: <Database size={16} /> },
  { href: '/branding',    label: 'Branding',    icon: <Palette size={16} /> },
];

export function AdminShell({ userEmail, children }: { userEmail: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const sb = getBrowserSupabase();
    await sb.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-(--dev-bg) text-(--dev-text)">
      {/* Sidebar */}
      {open && (
        <button
          aria-label="Cerrar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-(--dev-border) bg-(--dev-panel) transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex items-center gap-2 border-b border-(--dev-border) px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--dev-accent)">
            <Shield size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Admin Panel</div>
            <div className="text-[10px] uppercase tracking-wider text-(--dev-accent)">DEV MODE</div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto text-(--dev-muted) lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-(--dev-bg) text-white'
                        : 'text-(--dev-muted) hover:bg-(--dev-bg)/50 hover:text-white',
                      item.danger && active && 'ring-1 ring-(--dev-accent)/30'
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.danger && (
                      <span className="ml-auto rounded bg-(--dev-accent)/20 px-1.5 py-0.5 text-[10px] font-bold text-(--dev-accent)">
                        !
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-(--dev-border) p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-(--dev-muted)">Sesión</div>
          <div className="truncate text-xs text-white">{userEmail}</div>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-(--dev-muted) hover:bg-(--dev-bg) hover:text-white"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top warning bar */}
        <div className="flex items-center gap-2 border-b border-(--dev-border) bg-gradient-to-r from-red-900/40 to-red-950/40 px-4 py-2">
          <button onClick={() => setOpen(true)} className="lg:hidden">
            <Menu size={18} />
          </button>
          <AlertTriangle size={14} className="text-(--dev-accent)" />
          <span className="text-xs font-medium text-(--dev-accent) uppercase tracking-wider">
            Modo Desarrollo — Acciones registradas en auditoría
          </span>
        </div>

        <main className="flex-1 overflow-x-auto p-6">{children}</main>
      </div>
    </div>
  );
}

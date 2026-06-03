import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface AppShellProps {
  sidebar: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * AppShell — layout de dashboard "fixed shell, scrollable main"
 * (mismo patrón que Gmail, Linear, Notion, Slack).
 *
 *   - El BODY no scrollea (h-screen + overflow-hidden en el root)
 *   - Sidebar tiene su propio scroll vertical interno
 *   - Main column tiene su propio scroll vertical interno
 *   - TopBar es sticky dentro del main (no se mueve al scrollear)
 *
 * Beneficios sobre `position: sticky` en flex:
 *   - No depende del contexto de scroll del documento
 *   - Inmune a problemas con transform/overflow en ancestros
 *   - Sidebar y main pueden tener scrollbars independientes
 */
export function AppShell({ sidebar, topBar, children, className }: AppShellProps) {
  return (
    <div className={cn('flex h-screen w-full overflow-hidden bg-slate-50', className)}>
      {sidebar}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {topBar}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-7">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

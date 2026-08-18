import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@erp/db/client/server';

/** Layout mínimo para vistas de impresión: sin menú ni chrome, apto para PDF. */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServer(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <style>{`
        @media print {
          @page { margin: 1.4cm; }
          .no-print { display: none !important; }
          html, body { background: #fff; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      {children}
    </div>
  );
}

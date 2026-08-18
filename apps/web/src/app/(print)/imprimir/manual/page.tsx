import ManualContent from '../../../_manual/ManualContent';
import PrintToolbar from '../../_components/PrintToolbar';

export const dynamic = 'force-dynamic';

export default function ImprimirManualPage() {
  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  return (
    <div className="mx-auto max-w-[820px] p-4 print:max-w-none print:p-0">
      <PrintToolbar volverHref="/ayuda" titulo="Manual de usuario" />

      <article className="rounded-lg bg-white p-8 text-slate-800 shadow-sm print:rounded-none print:p-0 print:shadow-none">
        <header className="mb-6 border-b-2 border-slate-800 pb-3">
          <h1 className="text-base font-bold uppercase leading-tight tracking-tight">Sindicato de Choferes de Automóviles de Sitio y Camiones de Pasajeros de Nuevo Laredo</h1>
          <p className="mt-0.5 text-xs text-slate-500">Nuevo Laredo, Tamaulipas</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base font-semibold text-slate-700">MANUAL DE USUARIO DE LA PLATAFORMA</span>
            <span className="text-xs text-slate-500">{hoy}</span>
          </div>
        </header>

        <ManualContent />

        <p className="mt-8 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
          Manual generado el {hoy} desde la plataforma del Sindicato.
        </p>
      </article>
    </div>
  );
}

import ManualContent, { SECCIONES } from '../../_manual/ManualContent';
import { Card, CardBody } from '@erp/ui/primitives';
import { HelpCircle, Printer } from 'lucide-react';

export default function AyudaPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold ink">
            <HelpCircle size={22} className="text-slate-400" /> Centro de ayuda
          </h1>
          <p className="text-sm text-slate-500">Guía de uso de la plataforma. Puedes descargarla como manual en PDF.</p>
        </div>
        <a
          href="/imprimir/manual"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          <Printer size={15} /> Descargar manual (PDF)
        </a>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        {/* Índice */}
        <nav className="hidden lg:block">
          <div className="sticky top-4 rounded-xl border border-slate-200 bg-white p-3">
            <div className="label-erp mb-2 px-1">Contenido</div>
            <ul className="flex flex-col">
              {SECCIONES.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <Card>
          <CardBody>
            <ManualContent />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseServer } from '@erp/db/client/server';
import NuevoSocioWizard from './_components/NuevoSocioWizard';

export const dynamic = 'force-dynamic';

export default async function NuevoSocioPage() {
  const sb = createSupabaseServer(await cookies());
  const { data: sitios } = await sb
    .from('sitios')
    .select('id, nombre')
    .order('nombre');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/padron"
          className="tap-target inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft size={16} /> Padrón
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alta de socio</h1>
          <p className="text-sm text-slate-500">
            Completa los pasos para agregar un nuevo agremiado al padrón.
          </p>
        </div>
      </div>

      <NuevoSocioWizard sitios={(sitios ?? []) as { id: string; nombre: string }[]} />
    </div>
  );
}

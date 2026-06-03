import { cookies } from 'next/headers';
import { createSupabaseServer } from '@erp/db/client/server';
import { listarChoferes, conteosChoferes, type EstadoVencimiento } from '@erp/db/queries/choferes';
import ChoferesView from './_components/ChoferesView';

const PAGE_SIZE = 50;

type SearchParams = {
  q?: string;
  tipo?: string;        // concesionario | solo_chofer
  sitio?: string;       // uuid
  licencia?: string;    // VENCIDA | URGENTE | PROXIMA | VIGENTE | SIN_REGISTRO
  antidoping?: string;
  poliza?: string;
  mens?: string;        // '1' = con mensualidades pendientes
  acc?: string;         // '1' = con accidentes pendientes
  limit?: string;
};

export default async function ChoferesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const supabase = createSupabaseServer(await cookies());
  const limit = Math.min(Number(sp.limit) || PAGE_SIZE, 500);

  const [{ data, total }, conteos, { data: sitios }] = await Promise.all([
    listarChoferes(supabase, {
      busqueda: sp.q,
      tipo: sp.tipo === 'concesionario' || sp.tipo === 'solo_chofer' ? sp.tipo : undefined,
      sitioId: sp.sitio || undefined,
      licencia: sp.licencia as EstadoVencimiento | undefined,
      antidoping: sp.antidoping as EstadoVencimiento | undefined,
      poliza: sp.poliza as EstadoVencimiento | undefined,
      conMensualidadesPendientes: sp.mens === '1',
      conAccidentesPendientes: sp.acc === '1',
      limit,
      offset: 0,
    }),
    conteosChoferes(supabase),
    supabase.from('sitios').select('id, nombre').order('nombre'),
  ]);

  return (
    <ChoferesView
      initialChoferes={data as never}
      total={total}
      pageSize={PAGE_SIZE}
      currentLimit={limit}
      conteos={conteos}
      sitios={(sitios ?? []) as { id: string; nombre: string }[]}
      initialFilters={{
        q: sp.q ?? '',
        tipo: sp.tipo ?? '',
        sitio: sp.sitio ?? '',
        licencia: sp.licencia ?? '',
        antidoping: sp.antidoping ?? '',
        poliza: sp.poliza ?? '',
        mens: sp.mens ?? '',
        acc: sp.acc ?? '',
      }}
    />
  );
}

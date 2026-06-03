import { cookies } from 'next/headers';
import { createSupabaseServer } from '@erp/db/client/server';
import { listarSocios, conteosPadron } from '@erp/db/queries/socios';
import PadronView from './_components/PadronView';

const PAGE_SIZE = 50;

type SearchParams = {
  q?: string;
  estatus?: string;
  tipo?: string;
  cat?: string;        // categoría sindical: act, veint, tran
  firma?: string;      // 'pendiente'
  limit?: string;      // soporta carga progresiva con `&limit=100` etc.
};

export default async function PadronPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const supabase = createSupabaseServer(await cookies());

  const limit = Math.min(Number(sp.limit) || PAGE_SIZE, 500);

  const [{ data, total }, conteos] = await Promise.all([
    listarSocios(supabase, {
      busqueda: sp.q,
      estatus: sp.estatus as never,
      tipoSocio: sp.tipo as never,
      socAct: sp.cat === 'act',
      socVeint: sp.cat === 'veint',
      socTran: sp.cat === 'tran',
      firmaPendiente: sp.firma === 'pendiente',
      limit,
      offset: 0,
    }),
    conteosPadron(supabase),
  ]);

  return (
    <PadronView
      initialSocios={data as never}
      total={total}
      pageSize={PAGE_SIZE}
      currentLimit={limit}
      conteos={conteos}
      initialFilters={{
        q: sp.q ?? '',
        estatus: sp.estatus ?? '',
        tipo: sp.tipo ?? '',
        cat: sp.cat ?? '',
        firma: sp.firma ?? '',
      }}
    />
  );
}

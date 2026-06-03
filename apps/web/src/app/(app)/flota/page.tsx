import { cookies } from 'next/headers';
import { createSupabaseServer } from '@erp/db/client/server';
import { listarVehiculos, listarMarcas, conteosFlota } from '@erp/db/queries/vehiculos';
import FlotaView from './_components/FlotaView';

const PAGE_SIZE = 50;

type SearchParams = {
  q?: string;
  estatus?: string;
  marca?: string;
  indep?: string;       // '1' = solo independientes
  limit?: string;
};

export default async function FlotaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const supabase = createSupabaseServer(await cookies());

  const limit = Math.min(Number(sp.limit) || PAGE_SIZE, 500);

  const [{ data, total }, marcas, conteos] = await Promise.all([
    listarVehiculos(supabase, {
      busqueda: sp.q,
      estatus: sp.estatus as never,
      marca: sp.marca,
      esIndependiente: sp.indep === '1' ? true : undefined,
      limit,
      offset: 0,
    }),
    listarMarcas(supabase),
    conteosFlota(supabase),
  ]);

  return (
    <FlotaView
      initialVehiculos={data as never}
      total={total}
      pageSize={PAGE_SIZE}
      currentLimit={limit}
      marcas={marcas}
      conteos={conteos}
      initialFilters={{
        q: sp.q ?? '',
        estatus: sp.estatus ?? '',
        marca: sp.marca ?? '',
        indep: sp.indep ?? '',
      }}
    />
  );
}

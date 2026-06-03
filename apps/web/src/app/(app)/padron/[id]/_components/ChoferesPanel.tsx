import { cookies } from 'next/headers';
import { createSupabaseServer } from '@erp/db/client/server';
import { choferesPorConcesion } from '@erp/db/queries/choferes';
import { fmtFechaCorta } from '@erp/shared/formatters';
import { UserCircle } from 'lucide-react';
import ChoferesActions from './ChoferesActions';

interface Props {
  concesionId: string;
  taxiNumero: number | null;
  numeroConcesion: string;
  expedienteSocioId: string;
}

type Row = {
  id: string;
  concesion_id: string;
  chofer_socio_id: string;
  rol: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  porcentaje: number | null;
  renta_diaria: number | null;
  socios: {
    id: string;
    nombre_completo: string;
    foto_url: string | null;
    rfc: string | null;
    escalafon_numero: number | null;
  } | null;
};

const ROL_LABEL: Record<string, string> = {
  CHOFER: 'Chofer',
  CHOFER_RELEVO: 'Chofer de relevo',
  AYUDANTE: 'Ayudante',
};

export default async function ChoferesPanel({
  concesionId, taxiNumero, numeroConcesion, expedienteSocioId,
}: Props) {
  const sb = createSupabaseServer(await cookies());
  const rows = (await choferesPorConcesion(sb, concesionId)) as unknown as Row[];
  const activos = rows.filter((r) => !r.fecha_fin);
  const historicos = rows.filter((r) => !!r.fecha_fin);

  const titularYaTuvoContrato = rows.some((r) => r.chofer_socio_id === expedienteSocioId);
  const mostrarBotonTitular = !titularYaTuvoContrato;

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h4 className="text-sm font-semibold ink">
            Choferes {taxiNumero ? `del Taxi #${taxiNumero}` : `de ${numeroConcesion}`}
          </h4>
          <p className="text-xs text-secondary">
            {activos.length} activo(s) · {historicos.length} histórico(s)
          </p>
        </div>
        <ChoferesActions
          concesionId={concesionId}
          expedienteSocioId={expedienteSocioId}
          numeroConcesion={numeroConcesion}
          taxiNumero={taxiNumero}
          mode="add"
        />
      </div>

      {activos.length === 0 && historicos.length === 0 ? (
        <div className="px-4 py-5">
          <p className="mb-3 text-center text-sm text-secondary">
            Sin choferes registrados.
          </p>
          {mostrarBotonTitular && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="mb-2 text-sm text-slate-700">
                ¿El titular maneja esta unidad?
              </p>
              <ChoferesActions
                mode="markTitular"
                concesionId={concesionId}
                expedienteSocioId={expedienteSocioId}
                numeroConcesion={numeroConcesion}
                taxiNumero={taxiNumero}
              />
              <p className="mt-2 text-xs text-secondary">
                Si solo es titular sin manejar (renta, herencia, etc.), deja vacío y usa “Asignar chofer” para registrar a otra persona.
              </p>
            </div>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {[...activos, ...historicos].map((r) => {
            const s = r.socios;
            const activo = !r.fecha_fin;
            return (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <UserCircle size={28} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium ink">
                      {s?.nombre_completo ?? '—'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {activo ? 'Activo' : 'Cerrado'}
                    </span>
                  </div>
                  <div className="text-xs text-secondary">
                    {ROL_LABEL[r.rol] ?? r.rol} ·
                    {' '}desde {fmtFechaCorta(r.fecha_inicio)}
                    {r.fecha_fin && <> · hasta {fmtFechaCorta(r.fecha_fin)}</>}
                    {r.porcentaje != null && <> · {r.porcentaje}%</>}
                    {r.renta_diaria != null && <> · ${r.renta_diaria}/día</>}
                  </div>
                </div>
                {activo && (
                  <ChoferesActions
                    contratoId={r.id}
                    choferNombre={s?.nombre_completo ?? 'el chofer'}
                    expedienteSocioId={expedienteSocioId}
                    mode="terminate"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Gráficas del tablero — SVG/CSS puro (sin dependencias), server components.
// Paleta validada con la guía dataviz: emerald/azul (categórica) y estado
// vigente/por-vencer/vencida (status, con etiquetas directas + leyenda).

const INK = '#1e293b';
const EMERALD = '#059669';
const BLUE = '#2563eb';
const STATUS = { vigente: '#059669', por_vencer: '#f59e0b', vencida: '#e11d48' };

// ── Barras verticales: pólizas que vencen por mes ──
export function VencimientosPorMesChart({ data }: { data: { label: string; n: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const hayDatos = data.some((d) => d.n > 0);
  if (!hayDatos) return <p className="py-10 text-center text-sm text-slate-400">Sin vencimientos en el periodo 🎉</p>;
  return (
    <div>
      <div className="flex h-40 items-end gap-2 pt-6">
        {data.map((d) => (
          <div key={d.label} className="relative flex flex-1 items-end" title={`${d.label}: ${d.n} pólizas`}>
            <div
              className="w-full rounded-t transition-all"
              style={{ height: `${Math.max(d.n > 0 ? 3 : 0, (d.n / max) * 100)}%`, background: INK, minHeight: d.n > 0 ? 2 : 0 }}
            />
            <span className="num absolute inset-x-0 -top-5 text-center text-xs font-medium tabular-nums text-slate-500">
              {d.n || ''}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center text-xs capitalize text-slate-400">{d.label}</div>
        ))}
      </div>
    </div>
  );
}

// ── Dona: estado de pólizas ──
export function EstadoPolizasChart({ data }: { data: { vigente: number; por_vencer: number; vencida: number } }) {
  const segs = [
    { key: 'vigente', label: 'Vigentes', n: data.vigente, color: STATUS.vigente },
    { key: 'por_vencer', label: 'Por vencer', n: data.por_vencer, color: STATUS.por_vencer },
    { key: 'vencida', label: 'Vencidas', n: data.vencida, color: STATUS.vencida },
  ].filter((s) => s.n > 0);
  const total = segs.reduce((a, s) => a + s.n, 0);
  if (total === 0) return <p className="py-10 text-center text-sm text-slate-400">Sin pólizas registradas</p>;

  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="5" />
          {segs.map((s) => {
            const pct = (s.n / total) * 100;
            const dash = Math.max(0, pct - 1.5); // 1.5u de separación entre segmentos
            const el = (
              <circle
                key={s.key}
                cx="21" cy="21" r="15.9155" fill="none"
                stroke={s.color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={100 - acc}
              >
                <title>{`${s.label}: ${s.n} (${Math.round(pct)}%)`}</title>
              </circle>
            );
            acc += pct;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-2xl font-bold tabular-nums text-slate-800">{total.toLocaleString('es-MX')}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">pólizas</span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-2 sm:w-auto">
        {segs.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
            <span className="flex-1 text-slate-600">{s.label}</span>
            <span className="num font-semibold tabular-nums text-slate-800">{s.n.toLocaleString('es-MX')}</span>
            <span className="num w-10 text-right text-xs tabular-nums text-slate-400">{Math.round((s.n / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Barras agrupadas: altas vs bajas por mes ──
export function AltasBajasChart({ data }: { data: { label: string; altas: number; bajas: number }[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.altas, d.bajas]));
  const hayDatos = data.some((d) => d.altas > 0 || d.bajas > 0);
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: EMERALD }} /> Altas</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: BLUE }} /> Bajas</span>
      </div>
      {!hayDatos ? (
        <p className="py-10 text-center text-sm text-slate-400">Sin movimientos en el periodo</p>
      ) : (
        <>
          <div className="flex h-36 items-end gap-3">
            {data.map((d) => (
              <div key={d.label} className="flex flex-1 items-end justify-center gap-0.5">
                <div className="w-1/2 rounded-t" style={{ height: `${(d.altas / max) * 100}%`, background: EMERALD, minHeight: d.altas > 0 ? 2 : 0 }} title={`Altas ${d.label}: ${d.altas}`} />
                <div className="w-1/2 rounded-t" style={{ height: `${(d.bajas / max) * 100}%`, background: BLUE, minHeight: d.bajas > 0 ? 2 : 0 }} title={`Bajas ${d.label}: ${d.bajas}`} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            {data.map((d) => (
              <div key={d.label} className="flex-1 text-center text-xs capitalize text-slate-400">{d.label}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Formateadores de datos (fechas, monedas, identificadores)
// ─────────────────────────────────────────────────────────────
import { format, parseISO, differenceInDays, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';

const MX_TZ_LOCALE = es;

// ── Fechas ──
export function fmtFecha(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, "d 'de' MMMM yyyy", { locale: MX_TZ_LOCALE });
}

export function fmtFechaCorta(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, 'd MMM yyyy', { locale: MX_TZ_LOCALE }).toUpperCase();
}

export function fmtPeriodoCompacto(inicio: string | Date | null, fin: string | Date | null | undefined): string {
  if (!inicio) return '—';
  const ini = fmtFechaCorta(inicio);
  if (!fin) return `${ini} → ● En curso`;
  return `${ini} → ${fmtFechaCorta(fin)}`;
}

// ── Días restantes ──
export function diasParaVencer(fechaVenc: string | Date | null | undefined): number | null {
  if (!fechaVenc) return null;
  const venc = typeof fechaVenc === 'string' ? parseISO(fechaVenc) : fechaVenc;
  return differenceInDays(venc, new Date());
}

export function estadoVencimiento(dias: number | null, umbralPorVencer = 30): 'VIGENTE' | 'POR_VENCER' | 'VENCIDA' | 'DESCONOCIDO' {
  if (dias === null) return 'DESCONOCIDO';
  if (dias < 0) return 'VENCIDA';
  if (dias <= umbralPorVencer) return 'POR_VENCER';
  return 'VIGENTE';
}

// ── Monedas ──
const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });

export function fmtMoneda(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === '') return '—';
  const v = typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(v)) return '—';
  return MXN.format(v);
}

export function fmtMontoCompacto(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

// ── Identificadores ──
export function fmtConcesion(c: string | null | undefined): string {
  if (!c) return '—';
  return c.toUpperCase();
}

export function fmtPlacas(p: string | null | undefined): string {
  if (!p) return '—';
  return p.toUpperCase().replace(/\s+/g, '');
}

export function fmtRFC(r: string | null | undefined): string {
  if (!r) return '—';
  return r.toUpperCase();
}

// ── Nombres ──
export function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return '—';
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function nombreCorto(nombre: string | null | undefined, maxPalabras = 3): string {
  if (!nombre) return '—';
  const parts = nombre.trim().split(/\s+/);
  return parts.slice(0, maxPalabras).join(' ');
}

// ── Antigüedad ──
export function antiguedadTexto(fechaIngreso: string | Date | null | undefined): string {
  if (!fechaIngreso) return '—';
  const fi = typeof fechaIngreso === 'string' ? parseISO(fechaIngreso) : fechaIngreso;
  const anos = differenceInYears(new Date(), fi);
  if (anos === 0) return 'Menos de 1 año';
  if (anos === 1) return '1 año';
  return `${anos} años`;
}

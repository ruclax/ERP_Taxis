// ─────────────────────────────────────────────────────────────
// Utilidades de propósito general
// ─────────────────────────────────────────────────────────────

export function normNombre(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/\s*\(\+\)\s*$/, '')          // quita (+) de fallecidos
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')        // quita acentos
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

export function tieneCruzFallecido(nombre: string | null | undefined): boolean {
  return /\(\+\)/.test(nombre ?? '');
}

export function uniqueBy<T, K>(arr: T[], keyFn: (x: T) => K): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

export function groupBy<T, K extends string | number>(arr: T[], keyFn: (x: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of arr) {
    const k = keyFn(item);
    if (!out[k]) out[k] = [];
    out[k].push(item);
  }
  return out;
}

export function classNames(...parts: (string | undefined | null | false)[]): string {
  return parts.filter(Boolean).join(' ');
}

// Tipo helper: marca todas las props de T como nullable (útil para Row types)
export type Nullable<T> = { [K in keyof T]: T[K] | null };

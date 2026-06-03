'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Hook para manejar búsquedas recientes en localStorage por "scope" (padron, flota, etc.)
 *
 * Ejemplo:
 *   const { recents, add, remove, clear } = useRecentSearches('padron');
 *   add('LOPEZ');             // Guarda al hacer submit
 *   remove('LOPEZ');          // Quita una
 *   clear();                  // Limpia todas
 */
export function useRecentSearches(scope: string, max = 5) {
  const key = `erp.recents.${scope}`;
  const [recents, setRecents] = useState<string[]>([]);

  // Cargar al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecents(parsed.filter((x) => typeof x === 'string').slice(0, max));
      }
    } catch {
      // Ignore JSON errors
    }
  }, [key, max]);

  const persist = useCallback((next: string[]) => {
    setRecents(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(next));
    }
  }, [key]);

  const add = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecents((prev) => {
      const filtered = prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, max);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(next));
      }
      return next;
    });
  }, [key, max]);

  const remove = useCallback((q: string) => {
    setRecents((prev) => {
      const next = prev.filter((x) => x !== q);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(next));
      }
      return next;
    });
  }, [key]);

  const clear = useCallback(() => persist([]), [persist]);

  return { recents, add, remove, clear };
}

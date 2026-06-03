// ─────────────────────────────────────────────────────────────
// Hooks de autenticación y rol (client-side React)
// ─────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';
import type { Database } from '@erp/db/types';
import type { RolCodigo } from '@erp/db';
import { ROLES, type Modulo, rolPuedeVer, rolPuedeEditar, rolSoloLectura } from './rbac';

type SB = SupabaseClient<Database>;

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Hook que escucha cambios de sesión de Supabase Auth.
 */
export function useAuth(sb: SB): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true });

  useEffect(() => {
    let mounted = true;

    sb.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setState({ user: session?.user ?? null, session, loading: false });
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (mounted) setState({ user: session?.user ?? null, session, loading: false });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [sb]);

  return state;
}

export interface UsuarioRolInfo {
  rolCodigo: RolCodigo;
  scopeSitioId: string | null;
  scopeAreaNum: number | null;
  suplente: boolean;
}

/**
 * Hook que carga los roles del usuario actual desde `usuarios_roles`.
 * Retorna la "rol activa" (primera por jerarquía) y la lista completa.
 */
export function useUserRoles(sb: SB, userId: string | null) {
  const [roles, setRoles] = useState<UsuarioRolInfo[]>([]);
  const [activeRole, setActiveRole] = useState<RolCodigo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setActiveRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    sb.from('usuarios_roles')
      .select('rol_codigo, scope_sitio_id, scope_area_num, suplente')
      .eq('user_id', userId)
      .eq('activo', true)
      .then(({ data, error }) => {
        if (error) {
          console.error('[useUserRoles] error:', error.message);
          setRoles([]);
          setActiveRole(null);
        } else {
          const list = (data ?? []).map((r) => ({
            rolCodigo: r.rol_codigo as RolCodigo,
            scopeSitioId: r.scope_sitio_id,
            scopeAreaNum: r.scope_area_num,
            suplente: r.suplente ?? false,
          }));
          list.sort((a, b) => ROLES[a.rolCodigo].ordenJerarquia - ROLES[b.rolCodigo].ordenJerarquia);
          setRoles(list);
          // Lee de localStorage la rol seleccionada si está en la lista
          const stored = typeof window !== 'undefined' ? window.localStorage.getItem('erp.rolActivo') : null;
          if (stored && list.some((r) => r.rolCodigo === stored)) {
            setActiveRole(stored as RolCodigo);
          } else {
            setActiveRole(list[0]?.rolCodigo ?? null);
          }
        }
        setLoading(false);
      });
  }, [sb, userId]);

  const changeRole = useCallback((codigo: RolCodigo) => {
    setActiveRole(codigo);
    if (typeof window !== 'undefined') window.localStorage.setItem('erp.rolActivo', codigo);
  }, []);

  return { roles, activeRole, changeRole, loading };
}

/**
 * Hook compuesto: auth + rol activa + helpers RBAC en un solo objeto.
 */
export function useSession(sb: SB) {
  const auth = useAuth(sb);
  const { roles, activeRole, changeRole, loading: rolesLoading } = useUserRoles(sb, auth.user?.id ?? null);

  return {
    ...auth,
    loading: auth.loading || rolesLoading,
    roles,
    activeRole,
    changeRole,
    puedeVer: (m: Modulo) => rolPuedeVer(activeRole ?? undefined, m),
    puedeEditar: (m: Modulo) => rolPuedeEditar(activeRole ?? undefined, m),
    soloLectura: (m: Modulo) => rolSoloLectura(activeRole ?? undefined, m),
  };
}

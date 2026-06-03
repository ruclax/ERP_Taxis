// ─────────────────────────────────────────────────────────────
// Catálogo de vistas rápidas por rol y por módulo.
// Cada vista es un preset de filtros con un nombre amigable y un icono.
// El componente <VistasRapidas> renderiza estos como botones grandes
// arriba de la lista filtrable.
// ─────────────────────────────────────────────────────────────

import type { RolCodigo } from '@erp/db';

export interface VistaRapida {
  /** ID único dentro del módulo */
  id: string;
  /** Etiqueta corta del botón (visible al usuario) */
  label: string;
  /** Descripción extendida (tooltip o subtítulo) */
  description?: string;
  /** Nombre del icono lucide (se renderiza dinámicamente) */
  icon: string;
  /** Tono visual: default, accent (rojo), warn (ámbar), success (verde) */
  tone?: 'default' | 'accent' | 'warn' | 'success';
  /** URL completa con query params que esta vista activa */
  href: string;
}

// ── PADRÓN DE SOCIOS ──
export const VISTAS_PADRON: Record<RolCodigo | 'superadmin', VistaRapida[]> = {
  superadmin: [
    { id: 'todos', label: 'Todos los socios', icon: 'Users', href: '/padron' },
    { id: 'firma-pendiente', label: 'Pendientes de firma', icon: 'PenLine', tone: 'warn', href: '/padron?firma=pendiente' },
    { id: 'fallecidos', label: 'Marcados como fallecidos', icon: 'Cross', tone: 'accent', href: '/padron?estatus=FALLECIDO' },
    { id: 'soc-veint', label: '20+ años de antigüedad', icon: 'Award', tone: 'success', href: '/padron?cat=veint' },
    { id: 'soc-tran', label: 'En transición', icon: 'Repeat', href: '/padron?cat=tran' },
    { id: 'sin-rfc', label: 'Sin RFC capturado', icon: 'AlertCircle', tone: 'warn', href: '/padron?firma=pendiente' },
  ],
  sec_general: [
    { id: 'todos', label: 'Todos los socios', icon: 'Users', href: '/padron' },
    { id: 'activos', label: 'Solo activos', icon: 'CheckCircle', tone: 'success', href: '/padron?estatus=ACTIVO' },
    { id: 'pendientes-aprobacion', label: 'Pendientes de aprobación', icon: 'Clock', tone: 'warn', href: '/padron?firma=pendiente' },
    { id: 'fallecidos', label: 'Fallecidos', icon: 'Cross', tone: 'accent', href: '/padron?estatus=FALLECIDO' },
    { id: 'soc-veint', label: 'Veteranos 20+', icon: 'Award', tone: 'success', href: '/padron?cat=veint' },
  ],
  sec_organizacion: [
    { id: 'todos', label: 'Todos los socios', icon: 'Users', href: '/padron' },
    { id: 'firma-pendiente', label: 'Pendientes de firma', icon: 'PenLine', tone: 'warn', href: '/padron?firma=pendiente' },
    { id: 'soc-act', label: 'Socios activos (SOC_ACT)', icon: 'CheckCircle', tone: 'success', href: '/padron?cat=act' },
    { id: 'soc-tran', label: 'En transición', icon: 'Repeat', href: '/padron?cat=tran' },
    { id: 'independientes', label: 'Independientes', icon: 'UserMinus', href: '/padron?tipo=INDEPENDIENTE' },
    { id: 'recientes', label: 'Recién dados de baja', icon: 'UserX', tone: 'accent', href: '/padron?estatus=BAJA_DEFINITIVA' },
  ],
  tesorero: [
    { id: 'todos', label: 'Todos los socios', icon: 'Users', href: '/padron' },
    { id: 'activos', label: 'Activos (cobrables)', icon: 'CheckCircle', tone: 'success', href: '/padron?estatus=ACTIVO' },
    // Nota: "con adeudo" requiere join con adeudos — implementar en filtro avanzado luego
  ],
  sec_actas: [
    { id: 'todos', label: 'Todos los socios', icon: 'Users', href: '/padron' },
    { id: 'activos', label: 'Socios votantes (activos)', icon: 'CheckCircle', tone: 'success', href: '/padron?estatus=ACTIVO' },
  ],
  sec_trabajo: [
    { id: 'todos', label: 'Todos los socios', icon: 'Users', href: '/padron' },
  ],
  honor_justicia: [
    { id: 'todos', label: 'Todos los socios', icon: 'Users', href: '/padron' },
  ],
  hacienda: [
    { id: 'todos', label: 'Todos los socios', icon: 'Users', href: '/padron' },
  ],
  delegado: [
    { id: 'todos', label: 'Todos del padrón', icon: 'Users', href: '/padron' },
    // Nota: 'Mi sitio' requiere scope_sitio del usuario — agregar luego
    { id: 'activos', label: 'Activos', icon: 'CheckCircle', tone: 'success', href: '/padron?estatus=ACTIVO' },
  ],
};

// ── FLOTA VEHICULAR ──
export const VISTAS_FLOTA: Record<RolCodigo | 'superadmin', VistaRapida[]> = {
  superadmin: [
    { id: 'todas', label: 'Todas las unidades', icon: 'Car', href: '/flota' },
    { id: 'activas', label: 'En operación', icon: 'CheckCircle', tone: 'success', href: '/flota?estatus=ACTIVO' },
    { id: 'fuera', label: 'Fuera del sindicato', icon: 'CarOff', tone: 'warn', href: '/flota?estatus=FUERA_SINDICATO' },
    { id: 'siniestradas', label: 'Siniestradas', icon: 'AlertTriangle', tone: 'accent', href: '/flota?estatus=SINIESTRADO' },
    { id: 'independientes', label: 'Independientes', icon: 'UserMinus', href: '/flota?indep=1' },
  ],
  sec_general: [
    { id: 'todas', label: 'Todas las unidades', icon: 'Car', href: '/flota' },
    { id: 'activas', label: 'En operación', icon: 'CheckCircle', tone: 'success', href: '/flota?estatus=ACTIVO' },
    { id: 'siniestradas', label: 'Siniestradas', icon: 'AlertTriangle', tone: 'accent', href: '/flota?estatus=SINIESTRADO' },
  ],
  sec_organizacion: [
    { id: 'todas', label: 'Todas las unidades', icon: 'Car', href: '/flota' },
    { id: 'activas', label: 'En operación', icon: 'CheckCircle', tone: 'success', href: '/flota?estatus=ACTIVO' },
    { id: 'fuera', label: 'Fuera del sindicato', icon: 'CarOff', tone: 'warn', href: '/flota?estatus=FUERA_SINDICATO' },
    { id: 'independientes', label: 'Carros independientes', icon: 'UserMinus', href: '/flota?indep=1' },
  ],
  tesorero: [
    { id: 'todas', label: 'Todas', icon: 'Car', href: '/flota' },
  ],
  sec_actas:      [{ id: 'todas', label: 'Todas', icon: 'Car', href: '/flota' }],
  sec_trabajo:    [{ id: 'todas', label: 'Todas', icon: 'Car', href: '/flota' }],
  honor_justicia: [{ id: 'todas', label: 'Todas', icon: 'Car', href: '/flota' }],
  hacienda:       [{ id: 'todas', label: 'Todas', icon: 'Car', href: '/flota' }],
  delegado: [
    { id: 'todas', label: 'Todas las unidades', icon: 'Car', href: '/flota' },
    { id: 'activas', label: 'En operación', icon: 'CheckCircle', tone: 'success', href: '/flota?estatus=ACTIVO' },
  ],
};

/** Obtiene las vistas de un módulo para un rol */
export function vistasPara(modulo: 'padron' | 'flota', rol: RolCodigo | 'superadmin' | undefined): VistaRapida[] {
  if (!rol) return [];
  const map = modulo === 'padron' ? VISTAS_PADRON : VISTAS_FLOTA;
  return map[rol] ?? map.sec_general ?? [];
}

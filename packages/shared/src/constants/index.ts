// ─────────────────────────────────────────────────────────────
// Constantes del dominio ERP Taxi
// ─────────────────────────────────────────────────────────────

export const APP_NAME = 'Taxi ERP';
export const APP_DESC = 'Sindicato de Choferes de Sitio de Nuevo Laredo';

// ── Colores institucionales (del prototipo) ──
export const COLORS = {
  crit: '#420808',         // Rojo institucional para vencimientos/críticos
  critBg: '#fef2f2',
  critBorder: '#fecaca',
  ink: '#0f172a',          // Slate 900
  body: '#334155',         // Slate 700
  label: '#64748b',        // Slate 500
  line: '#e2e8f0',         // Slate 200
  oxford: '#1e293b',       // Botones primarios
} as const;

// ── Etiquetas de roles ──
export const ROL_LABELS: Record<string, string> = {
  sec_general: 'Secretario General',
  sec_organizacion: 'Sec. de Organización y Propaganda',
  tesorero: 'Secretario Tesorero',
  sec_actas: 'Sec. de Actas y Acuerdos',
  sec_trabajo: 'Sec. de Trabajo y Conflictos',
  honor_justicia: 'Comisión de Honor y Justicia',
  hacienda: 'Comisión de Hacienda',
  delegado: 'Delegado / Jefe de Sitio',
};

// ── Etiquetas de módulos ──
export const MODULO_LABELS: Record<string, string> = {
  mipanel: 'Mi Panel',
  dashboard: 'Tablero',
  padron: 'Padrón',
  flota: 'Flota',
  choferes: 'Choferes',
  polizas: 'Pólizas',
  funerario: 'Funerario',
  tesoreria: 'Tesorería',
  bitacora: 'Bitácora',
  asambleas: 'Asambleas',
  honor: 'Honor y Justicia',
};

// ── Estatus de socios ──
export const ESTATUS_LABELS: Record<string, string> = {
  ACTIVO: 'Activo',
  FALLECIDO: 'Fallecido',
  BAJA_DEFINITIVA: 'Baja definitiva',
  BAJA_TEMPORAL: 'Baja temporal',
  NO_PERTENECE: 'No pertenece',
};

// ── Plazos críticos ──
export const PLAZOS = {
  DICTAMEN_HYJ_DIAS: 15,        // Plazo de Honor y Justicia
  SANCION_DELEGADO_MAX_DIAS: 3, // Sanción máxima por delegado
  POLIZA_POR_VENCER_DIAS: 30,
  ANTIDOPING_VIGENCIA_MESES: 12,
} as const;

// ── Tipos de cuotas predefinidos ──
export const CUOTAS = {
  CUOTA_MENSUAL: 100,
  FUNERARIO_A: 180,
  FUNERARIO_B: 90,
} as const;

// ─────────────────────────────────────────────────────────────
// RBAC: matriz rol → módulos visibles + helpers de permisos
// Migrado desde prototype/roles.jsx y prototype/acciones-por-rol.jsx
// ─────────────────────────────────────────────────────────────
import type { RolCodigo } from '@erp/db';

export type Modulo =
  | 'mipanel' | 'dashboard' | 'padron' | 'flota' | 'choferes'
  | 'polizas' | 'funerario' | 'tesoreria' | 'bitacora' | 'asambleas' | 'honor';

export type ScopeTipo = 'GLOBAL' | 'AREA' | 'SITIO';

export interface RolDef {
  codigo: RolCodigo;
  nombre: string;
  descripcion: string;
  persona: string;
  suplente?: string;
  scope: ScopeTipo;
  modulos: Modulo[];
  soloLectura?: Modulo[];
  ordenJerarquia: number;
}

// Catálogo completo de roles con las personas reales del documento
export const ROLES: Record<RolCodigo, RolDef> = {
  sec_general: {
    codigo: 'sec_general',
    nombre: 'Secretario General',
    descripcion: 'Convoca juntas, representa al sindicato, autoriza datos y firma cortes de caja.',
    persona: 'Jorge Alberto Hernández González',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','padron','flota','choferes','polizas','funerario','tesoreria','bitacora','asambleas','honor'],
    ordenJerarquia: 1,
  },
  sec_organizacion: {
    codigo: 'sec_organizacion',
    nombre: 'Sec. de Organización y Propaganda',
    descripcion: 'Lleva registro minucioso de agremiados — altas, bajas, enfermos.',
    persona: 'Bernardo Alcaraz Frausto',
    suplente: 'Arturo Villarreal Amaro',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','padron','flota','choferes'],
    ordenJerarquia: 2,
  },
  tesorero: {
    codigo: 'tesorero',
    nombre: 'Secretario Tesorero',
    descripcion: 'Recibe aportaciones, deposita fondos, hace pagos, cortes mensuales.',
    persona: 'Jesús Torres Torres',
    suplente: 'Jesús Antonio Torres Solís',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','tesoreria','funerario','polizas'],
    ordenJerarquia: 3,
  },
  sec_actas: {
    codigo: 'sec_actas',
    nombre: 'Sec. de Actas y Acuerdos',
    descripcion: 'Levanta actas de asambleas, proporciona informes.',
    persona: 'Iván de Jesús Escamilla Moreno',
    suplente: 'Alejandro Jacinto Treviño Fernández',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','asambleas'],
    ordenJerarquia: 4,
  },
  sec_trabajo: {
    codigo: 'sec_trabajo',
    nombre: 'Sec. de Trabajo y Conflictos',
    descripcion: 'Conoce conflictos laborales por área, mantiene orden y disciplina.',
    persona: 'Ramón de Hoyos Gaona',
    suplente: 'José Luis Tobías Téllez',
    scope: 'AREA',
    modulos: ['mipanel','dashboard','bitacora','padron'],
    ordenJerarquia: 5,
  },
  honor_justicia: {
    codigo: 'honor_justicia',
    nombre: 'Comisión de Honor y Justicia',
    descripcion: 'Conoce consignaciones, dicta resoluciones en máximo 15 días.',
    persona: 'José Filiberto Hernández Noyola',
    suplente: 'Marcial Pérez Alemán',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','honor','padron'],
    ordenJerarquia: 6,
  },
  hacienda: {
    codigo: 'hacienda',
    nombre: 'Comisión de Hacienda',
    descripcion: 'Vigila el destino del tesoro, audita cortes de caja.',
    persona: 'Adalberto Solís Salinas',
    suplente: 'Isabel Cristina Ramos de la Fuente',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','tesoreria','funerario'],
    soloLectura: ['tesoreria','funerario'],
    ordenJerarquia: 7,
  },
  delegado: {
    codigo: 'delegado',
    nombre: 'Delegado / Jefe de Sitio',
    descripcion: 'Cobra cuotas, informa novedades, sanciona hasta 3 días.',
    persona: '(rotativo por sitio)',
    scope: 'SITIO',
    modulos: ['mipanel','dashboard','padron','flota','choferes','polizas','funerario'],
    soloLectura: ['padron','flota','choferes','polizas'],
    ordenJerarquia: 8,
  },
};

export const ROL_CODIGOS: RolCodigo[] = Object.keys(ROLES) as RolCodigo[];

// ── Helpers ──

export function rolPuedeVer(rol: RolCodigo | undefined, modulo: Modulo): boolean {
  if (!rol) return false;
  return ROLES[rol].modulos.includes(modulo);
}

export function rolSoloLectura(rol: RolCodigo | undefined, modulo: Modulo): boolean {
  if (!rol) return true;
  const def = ROLES[rol];
  if (!def.modulos.includes(modulo)) return true;
  return def.soloLectura?.includes(modulo) ?? false;
}

export function rolPuedeEditar(rol: RolCodigo | undefined, modulo: Modulo): boolean {
  return rolPuedeVer(rol, modulo) && !rolSoloLectura(rol, modulo);
}

export function alguno(rol: RolCodigo | undefined, codigos: RolCodigo[]): boolean {
  return rol ? codigos.includes(rol) : false;
}

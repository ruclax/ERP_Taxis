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

// Catálogo completo de roles.
//
// Política de quién puede ocupar cada rol:
//   • superadmin       — Solo el desarrollador de la plataforma (no requiere ser agremiado).
//   • admin_plataforma — Personal contratado por el sindicato para operar la
//                        plataforma. No requiere ser agremiado, pero puede serlo.
//   • 8 roles electos  — Sec.General, Sec.Organización, Tesorero, Sec.Actas,
//                        Sec.Trabajo, Honor y Justicia, Hacienda, Delegado.
//                        TODOS deben ser agremiados elegidos por asamblea.
//
// Esta política es decisión humana — no se enforza con constraints SQL.
export const ROLES: Record<RolCodigo, RolDef> = {
  superadmin: {
    codigo: 'superadmin',
    nombre: 'Super Administrador (Desarrollador)',
    descripcion: 'Rol exclusivo del desarrollador. Acceso god-mode a todas las tablas y bypasea RLS.',
    persona: 'Daniel Isaías Sánchez Treviño',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','padron','flota','choferes','polizas','funerario','tesoreria','bitacora','asambleas','honor'],
    ordenJerarquia: 0,
  },
  admin_plataforma: {
    codigo: 'admin_plataforma',
    nombre: 'Administrador de Plataforma',
    descripcion: 'Operador contratado por el sindicato. Administra, configura y mantiene al día la plataforma. Encargado de convocatorias, notificaciones y actualización de datos sensibles. Acceso de lectura y escritura a todos los módulos; cada acción queda en `auditoria`.',
    persona: 'Jesús Antonio Torres Solís',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','padron','flota','choferes','polizas','funerario','tesoreria','bitacora','asambleas','honor'],
    ordenJerarquia: 1,
  },
  sec_general: {
    codigo: 'sec_general',
    nombre: 'Secretario General',
    descripcion: 'Convoca juntas, representa al sindicato, autoriza datos y firma cortes de caja.',
    persona: 'Jorge Alberto Hernández González',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','padron','flota','choferes','polizas','funerario','tesoreria','bitacora','asambleas','honor'],
    ordenJerarquia: 2,
  },
  sec_organizacion: {
    codigo: 'sec_organizacion',
    nombre: 'Sec. de Organización y Propaganda',
    descripcion: 'Lleva registro minucioso de agremiados — altas, bajas, enfermos.',
    persona: 'Bernardo Alcaraz Frausto',
    suplente: 'Arturo Villarreal Amaro',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','padron','flota','choferes'],
    ordenJerarquia: 3,
  },
  tesorero: {
    codigo: 'tesorero',
    nombre: 'Secretario Tesorero',
    descripcion: 'Recibe aportaciones, deposita fondos, hace pagos, cortes mensuales.',
    persona: 'Jesús Torres Torres',
    suplente: 'Jesús Antonio Torres Solís',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','tesoreria','funerario','polizas'],
    ordenJerarquia: 4,
  },
  sec_actas: {
    codigo: 'sec_actas',
    nombre: 'Sec. de Actas y Acuerdos',
    descripcion: 'Levanta actas de asambleas, proporciona informes.',
    persona: 'Iván de Jesús Escamilla Moreno',
    suplente: 'Alejandro Jacinto Treviño Fernández',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','asambleas'],
    ordenJerarquia: 5,
  },
  sec_trabajo: {
    codigo: 'sec_trabajo',
    nombre: 'Sec. de Trabajo y Conflictos',
    descripcion: 'Conoce conflictos laborales por área, mantiene orden y disciplina.',
    persona: 'Ramón de Hoyos Gaona',
    suplente: 'José Luis Tobías Téllez',
    scope: 'AREA',
    modulos: ['mipanel','dashboard','bitacora','padron'],
    ordenJerarquia: 6,
  },
  honor_justicia: {
    codigo: 'honor_justicia',
    nombre: 'Comisión de Honor y Justicia',
    descripcion: 'Conoce consignaciones, dicta resoluciones en máximo 15 días.',
    persona: 'José Filiberto Hernández Noyola',
    suplente: 'Marcial Pérez Alemán',
    scope: 'GLOBAL',
    modulos: ['mipanel','dashboard','honor','padron'],
    ordenJerarquia: 7,
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
    ordenJerarquia: 8,
  },
  delegado: {
    codigo: 'delegado',
    nombre: 'Delegado / Jefe de Sitio',
    descripcion: 'Cobra cuotas, informa novedades, sanciona hasta 3 días.',
    persona: '(rotativo por sitio)',
    scope: 'SITIO',
    modulos: ['mipanel','dashboard','padron','flota','choferes','polizas','funerario'],
    soloLectura: ['padron','flota','choferes','polizas'],
    ordenJerarquia: 9,
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

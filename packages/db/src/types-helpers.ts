// ─────────────────────────────────────────────────────────────
// Aliases de tipos para uso ergonómico en la app
// ─────────────────────────────────────────────────────────────
import type { Database } from '../types/database';

type Tables = Database['public']['Tables'];

export type Socio = Tables['socios']['Row'];
export type SocioInsert = Tables['socios']['Insert'];
export type SocioUpdate = Tables['socios']['Update'];

export type Concesion = Tables['concesiones']['Row'];
export type Vehiculo = Tables['vehiculos']['Row'];
export type Poliza = Tables['polizas']['Row'];
export type Sitio = Tables['sitios']['Row'];

export type Rol = Tables['roles']['Row'];
export type UsuarioRol = Tables['usuarios_roles']['Row'];
export type UsuarioPerfil = Tables['usuarios_perfil']['Row'];

export type Antidoping = Tables['antidoping']['Row'];
export type HistorialChofer = Tables['historial_choferes']['Row'];
export type BitacoraAccidente = Tables['bitacora_accidentes']['Row'];
export type Adeudo = Tables['adeudos']['Row'];
export type Mensualidad = Tables['mensualidades_cuotas']['Row'];
export type Asamblea = Tables['asambleas']['Row'];
export type Acta = Tables['actas']['Row'];
export type Acuerdo = Tables['acuerdos']['Row'];
export type CasoHonorJusticia = Tables['casos_honor_justicia']['Row'];

// Enums comunes
// Enums comunes — derivados de la BD
export type EstatusSocio = 'ACTIVO' | 'FALLECIDO' | 'BAJA_DEFINITIVA' | 'BAJA_TEMPORAL' | 'NO_PERTENECE';
export type TipoSocio = 'CONCESIONARIO' | 'AGENCIA' | 'PERMISIONARIO' | 'INDEPENDIENTE' | 'HEREDERO' | 'OTRO';
export type EstadoPoliza = 'VIGENTE' | 'POR_VENCER' | 'VENCIDA' | 'CANCELADA';
export type EstatusVehiculo = 'ACTIVO' | 'FUERA_SINDICATO' | 'BAJA' | 'SINIESTRADO';
export type EstadoConcesion = 'VIGENTE' | 'BAJA' | 'EN_TRAMITE' | 'CESION_PENDIENTE' | 'SUCESION_PENDIENTE';

// Códigos de rol (coinciden con la tabla roles)
export type RolCodigo =
  | 'sec_general'
  | 'sec_organizacion'
  | 'tesorero'
  | 'sec_actas'
  | 'sec_trabajo'
  | 'honor_justicia'
  | 'hacienda'
  | 'delegado';

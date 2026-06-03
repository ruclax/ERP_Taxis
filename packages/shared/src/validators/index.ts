// ─────────────────────────────────────────────────────────────
// Validadores de esquema con Zod
// ─────────────────────────────────────────────────────────────
import { z } from 'zod';

// ── Identificadores ──
export const rfcSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/, 'RFC inválido')
  .nullable()
  .optional();

export const curpSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/, 'CURP inválida')
  .nullable()
  .optional();

export const concesionSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^\d{1,3}[A-Z]-\d{3,5}$/, 'Formato: 27P-0325');

export const placasSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{3,10}$/, 'Placas inválidas');

// ── Socio ──
export const socioEstatusSchema = z.enum([
  'ACTIVO',
  'FALLECIDO',
  'BAJA_DEFINITIVA',
  'BAJA_TEMPORAL',
  'NO_PERTENECE',
]);

export const tipoSocioSchema = z.enum([
  'CONCESIONARIO',
  'AGENCIA',
  'PERMISIONARIO',
  'INDEPENDIENTE',
  'HEREDERO',
  'OTRO',
]);

export const socioInsertSchema = z.object({
  rfc: rfcSchema,
  curp: curpSchema,
  nombre_completo: z.string().trim().min(3).max(120),
  fecha_nacimiento: z.string().date().nullable().optional(),
  escalafon_numero: z.number().int().positive().nullable().optional(),
  tipo_socio: tipoSocioSchema.default('CONCESIONARIO'),
  estatus: socioEstatusSchema.default('ACTIVO'),
  soc_act: z.boolean().default(false),
  soc_veint: z.boolean().default(false),
  soc_tran: z.boolean().default(false),
  turno: z.string().nullable().optional(),
  fecha_ingreso: z.string().date().nullable().optional(),
  comentarios: z.string().nullable().optional(),
});

export type SocioInsert = z.infer<typeof socioInsertSchema>;

// Shape extendido del wizard de alta (socio + dirección + contacto + concesión opcional)
export const nuevoSocioFormSchema = z.object({
  socio: socioInsertSchema,
  direccion: z.object({
    calle: z.string().trim().optional(),
    numero_ext: z.string().trim().optional(),
    colonia: z.string().trim().optional(),
    municipio: z.string().trim().optional(),
    estado: z.string().trim().optional(),
    codigo_postal: z.string().trim().optional(),
  }).optional(),
  contacto: z.object({
    telefono_movil: z.string().trim().optional(),
    telefono_fijo: z.string().trim().optional(),
    email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  }).optional(),
  concesion: z.object({
    numero_concesion: z.string().trim().optional(),
    sitio_id: z.string().uuid().optional().nullable(),
    taxi_numero: z.coerce.number().int().positive().optional().nullable(),
  }).optional(),
});

export type NuevoSocioForm = z.infer<typeof nuevoSocioFormSchema>;

// ── Concesión ──
export const concesionInsertSchema = z.object({
  numero_concesion: concesionSchema,
  socio_id: z.string().uuid(),
  sitio_id: z.string().uuid().nullable().optional(),
  taxi_numero: z.number().int().positive().nullable().optional(),
  tipo: z.enum(['CONCESION', 'PERMISO']).default('CONCESION'),
  estado: z.enum(['VIGENTE', 'BAJA', 'EN_TRAMITE', 'CESION_PENDIENTE', 'SUCESION_PENDIENTE']).default('VIGENTE'),
  fecha_concesion: z.string().date().nullable().optional(),
  modalidad: z.string().nullable().optional(),
  submodalidad: z.string().nullable().optional(),
  ruta_denominada: z.string().nullable().optional(),
  es_independiente: z.boolean().default(false),
});

export type ConcesionInsert = z.infer<typeof concesionInsertSchema>;

// ── Vehículo ──
export const vehiculoInsertSchema = z.object({
  placas: placasSchema.nullable().optional(),
  numero_serie: z.string().trim().nullable().optional(),
  marca: z.string().nullable().optional(),
  modelo: z.string().nullable().optional(),
  anio: z.number().int().min(1950).max(2099).nullable().optional(),
  color: z.string().nullable().optional(),
  estatus: z.enum(['ACTIVO', 'FUERA_SINDICATO', 'BAJA', 'SINIESTRADO']).default('ACTIVO'),
  es_independiente: z.boolean().default(false),
});

export type VehiculoInsert = z.infer<typeof vehiculoInsertSchema>;

// ── Póliza ──
export const polizaInsertSchema = z.object({
  vehiculo_id: z.string().uuid(),
  numero_poliza: z.string().trim().min(1),
  compania: z.string().trim().min(1),
  costo: z.number().nonnegative().nullable().optional(),
  fecha_inicio: z.string().date().nullable().optional(),
  fecha_vencimiento: z.string().date(),
  endoso: z.string().nullable().optional(),
});

export type PolizaInsert = z.infer<typeof polizaInsertSchema>;

// ── Mensualidad ──
export const mensualidadInsertSchema = z.object({
  socio_id: z.string().uuid(),
  sitio_id_donde_pago: z.string().uuid(),
  cuota_codigo: z.string(),
  periodo: z.string().date(),
  monto: z.number().nonnegative(),
  fecha_pago: z.string().datetime().nullable().optional(),
  estatus: z.enum(['PAGADO', 'PENDIENTE', 'PARCIAL', 'CONDONADO', 'VENCIDO']).default('PAGADO'),
});

export type MensualidadInsert = z.infer<typeof mensualidadInsertSchema>;

// ── Sanción ──
export const sancionSchema = z.object({
  socio_sancionado_id: z.string().uuid(),
  sitio_id: z.string().uuid(),
  delegado_socio_id: z.string().uuid(),
  fecha: z.string().date(),
  motivo: z.string().min(5),
  dias_sancion: z.number().int().min(1).max(3),  // Regla del estatuto
});

export type SancionInsert = z.infer<typeof sancionSchema>;

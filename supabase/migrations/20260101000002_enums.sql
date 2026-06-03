-- ─────────────────────────────────────────────────────────────
-- 002 — Enums del dominio
-- ─────────────────────────────────────────────────────────────

-- Estado del socio (códigos de color de Daniel.docx)
create type socio_estatus as enum (
  'ACTIVO',           -- Activo en el padrón
  'FALLECIDO',        -- Marcado con (+) en el CSV
  'BAJA_DEFINITIVA',  -- Ya no pertenece (rojo)
  'BAJA_TEMPORAL',    -- "Veremos" — debe dinero (naranja)
  'NO_PERTENECE'      -- Es concesionario pero no afiliado (amarillo)
);

create type tipo_socio as enum (
  'CONCESIONARIO',
  'AGENCIA',
  'PERMISIONARIO',
  'INDEPENDIENTE',
  'HEREDERO',
  'OTRO'
);

create type concesion_tipo as enum (
  'CONCESION',
  'PERMISO'
);

create type concesion_estado as enum (
  'VIGENTE',
  'BAJA',
  'EN_TRAMITE',
  'CESION_PENDIENTE',
  'SUCESION_PENDIENTE'
);

create type vehiculo_estatus as enum (
  'ACTIVO',
  'FUERA_SINDICATO',
  'BAJA',
  'SINIESTRADO'
);

create type poliza_estado as enum (
  'VIGENTE',
  'POR_VENCER',  -- < 30 días para vencer
  'VENCIDA',
  'CANCELADA'
);

create type revista_tipo as enum (
  'DOCUMENTAL',
  'MECANICA'
);

create type movimiento_tipo as enum (
  'INGRESO',
  'EGRESO'
);

create type pago_estatus as enum (
  'PAGADO',
  'PENDIENTE',
  'PARCIAL',
  'CONDONADO',
  'VENCIDO'
);

create type gravedad as enum (
  'BAJA',
  'MEDIA',
  'ALTA'
);

create type caso_estado as enum (
  'RECIBIDO',
  'EN_INSTRUCCION',
  'DICTAMINADO',
  'CERRADO',
  'ARCHIVADO'
);

create type asamblea_tipo as enum (
  'ORDINARIA',
  'EXTRAORDINARIA',
  'COMITE_EJECUTIVO'
);

create type acuerdo_estado as enum (
  'PENDIENTE',
  'EN_PROCESO',
  'CUMPLIDO',
  'CANCELADO'
);

create type rol_scope_tipo as enum (
  'GLOBAL',
  'AREA',
  'SITIO'
);

create type genero as enum (
  'M', 'F', 'X'
);

create type firma_estatus as enum (
  'RECABADA',
  'PENDIENTE',
  'NO_APLICA'
);

-- ─────────────────────────────────────────────────────────────
-- 009 — Historial de choferes por vehículo
-- Origen: requisito de Daniel.docx ("historial de choferes con fotografía y gafete")
-- ─────────────────────────────────────────────────────────────

create table historial_choferes (
  id                  uuid primary key default gen_random_uuid(),

  vehiculo_id         uuid not null references vehiculos(id) on delete cascade,
  chofer_socio_id     uuid not null references socios(id) on delete restrict,
  -- Quién hizo el cambio (operativamente el concesionario titular)
  asignado_por_socio_id uuid references socios(id) on delete set null,

  fecha_inicio        date not null,
  fecha_fin           date,
  motivo_cambio       text,

  -- Documentos / fotos del gafete (Supabase Storage)
  foto_gafete_url     text,
  foto_credencial_url text,

  observaciones       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint historial_choferes_fechas_check check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

create index hc_vehiculo on historial_choferes (vehiculo_id);
create index hc_chofer on historial_choferes (chofer_socio_id);
create index hc_activo on historial_choferes (vehiculo_id) where fecha_fin is null;
create index hc_periodo on historial_choferes using gist (
  vehiculo_id,
  daterange(fecha_inicio, coalesce(fecha_fin, 'infinity'::date), '[]')
);

create trigger hc_set_updated_at
  before update on historial_choferes
  for each row execute function private.tg_set_updated_at();

comment on table historial_choferes is 'Quién manejó cada vehículo en cada periodo — función crítica de Daniel.docx. Permite rastrear "últimos 5 choferes" y mostrar foto+gafete.';

-- ─────────────────────────────────────────────────────────────
-- 027 — Conteos para vistas rápidas de Padrón y Flota.
-- Una sola RPC por módulo retorna todos los conteos en un solo round-trip.
-- ─────────────────────────────────────────────────────────────

create or replace function public.vista_conteos_padron()
returns jsonb
language sql
stable
security invoker
as $$
  select jsonb_build_object(
    'todos',                (select count(*) from socios),
    'activos',              (select count(*) from socios where estatus = 'ACTIVO'),
    'fallecidos',           (select count(*) from socios where estatus = 'FALLECIDO'),
    'baja_definitiva',      (select count(*) from socios where estatus = 'BAJA_DEFINITIVA'),
    'baja_temporal',        (select count(*) from socios where estatus = 'BAJA_TEMPORAL'),
    'soc_act',              (select count(*) from socios where soc_act    = true),
    'soc_veint',            (select count(*) from socios where soc_veint  = true),
    'soc_tran',             (select count(*) from socios where soc_tran   = true),
    'firma_pendiente',      (select count(*) from socios where firma_actual is null or firma_actual = false),
    'firma_recabada',       (select count(*) from socios where firma_actual = true),
    'concesionarios',       (select count(*) from socios where tipo_socio = 'CONCESIONARIO'),
    'agencia',              (select count(*) from socios where tipo_socio = 'AGENCIA'),
    'independientes',       (select count(*) from socios where tipo_socio = 'INDEPENDIENTE'),
    'herederos',            (select count(*) from socios where tipo_socio = 'HEREDERO')
  );
$$;


create or replace function public.vista_conteos_flota()
returns jsonb
language sql
stable
security invoker
as $$
  select jsonb_build_object(
    'todas',          (select count(*) from vehiculos),
    'activas',        (select count(*) from vehiculos where estatus = 'ACTIVO'),
    'fuera',          (select count(*) from vehiculos where estatus = 'FUERA_SINDICATO'),
    'siniestradas',   (select count(*) from vehiculos where estatus = 'SINIESTRADO'),
    'baja',           (select count(*) from vehiculos where estatus = 'BAJA'),
    'independientes', (select count(*) from vehiculos where es_independiente = true),
    'sindicato',      (select count(*) from vehiculos where es_independiente = false)
  );
$$;

grant execute on function public.vista_conteos_padron() to authenticated;
grant execute on function public.vista_conteos_flota()  to authenticated;

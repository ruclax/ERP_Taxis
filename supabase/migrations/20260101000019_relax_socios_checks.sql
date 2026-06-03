-- ─────────────────────────────────────────────────────────────
-- 019 — Relajar constraints de socios
-- Los CSVs marcan fallecidos con (+) en el nombre pero NO traen fecha exacta.
-- Lo mismo ocurre con bajas: en muchos casos solo se conoce el estatus, no la fecha.
-- Eliminamos los check constraints obligatorios; la fecha se irá llenando con el tiempo.
-- ─────────────────────────────────────────────────────────────

alter table socios drop constraint if exists socios_fecha_baja_check;
alter table socios drop constraint if exists socios_fecha_fallecimiento_check;

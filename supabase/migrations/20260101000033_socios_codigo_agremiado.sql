-- ─────────────────────────────────────────────────────────────
-- 033 — Código único legible de agremiado: AGR-00001, AGR-00002, …
--
-- Identidad personal interna inmutable:
--   - asignado al alta, nunca cambia (aunque haya baja y reincorporación)
--   - se imprime/dice en voz alta sin ambigüedad
--   - distinto al escalafón (que es histórico y no todos lo tienen)
--   - distinto al taxi # (que identifica unidades, no personas)
-- ─────────────────────────────────────────────────────────────

-- 1) Columna
alter table public.socios
  add column if not exists codigo_agremiado text;

-- 2) Sequence para futuras altas
create sequence if not exists public.socios_codigo_seq;

-- 3) Backfill ordenado por antigüedad: fecha_ingreso ASC NULLS LAST,
--    escalafon ASC NULLS LAST, nombre. Así AGR-00001 es el más veterano.
with ordenados as (
  select id,
    row_number() over (
      order by fecha_ingreso nulls last,
               escalafon_numero nulls last,
               nombre_completo
    ) as n
  from public.socios
  where codigo_agremiado is null
)
update public.socios s
  set codigo_agremiado = 'AGR-' || lpad(o.n::text, 5, '0')
from ordenados o
where s.id = o.id;

-- Avanzar la sequence al MAX para que próximos inserts continúen donde se quedó.
select setval(
  'public.socios_codigo_seq',
  coalesce(
    (select max(substring(codigo_agremiado from 5)::int) from public.socios),
    0
  ),
  true
);

-- 4) Constraints
alter table public.socios
  alter column codigo_agremiado set not null,
  add constraint socios_codigo_agremiado_unique unique (codigo_agremiado),
  add constraint socios_codigo_agremiado_formato
    check (codigo_agremiado ~ '^AGR-\d{5,}$');

-- 5) Trigger que asigna automáticamente si el INSERT no trae el código
create or replace function private.tg_asignar_codigo_agremiado()
returns trigger
language plpgsql
as $$
begin
  if new.codigo_agremiado is null or new.codigo_agremiado = '' then
    new.codigo_agremiado := 'AGR-' || lpad(nextval('public.socios_codigo_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists socios_asignar_codigo on public.socios;
create trigger socios_asignar_codigo
  before insert on public.socios
  for each row execute function private.tg_asignar_codigo_agremiado();

-- 6) Índice para búsqueda directa por código
create index if not exists socios_codigo_agremiado_idx
  on public.socios (codigo_agremiado);

comment on column public.socios.codigo_agremiado is
  'Identificador personal inmutable del agremiado dentro de la plataforma (AGR-00001, AGR-00002, …). Asignado por trigger en cualquier INSERT; nunca debe modificarse manualmente.';

-- ─────────────────────────────────────────────────────────────
-- 049 — M4: Cambios de estatus del socio con reglas + historial
--
-- Cierra el ciclo de vida (alta → mantenimiento → baja). Registra
-- cada transición de estatus en `socios_historial_estatus` y aplica
-- las reglas de negocio en una sola transacción vía RPC.
--
-- Estatus (enum socio_estatus): ACTIVO, FALLECIDO, BAJA_DEFINITIVA,
-- BAJA_TEMPORAL, NO_PERTENECE.
-- ─────────────────────────────────────────────────────────────

create table socios_historial_estatus (
  id                uuid primary key default gen_random_uuid(),
  socio_id          uuid not null references socios(id) on delete cascade,
  estatus_anterior  socio_estatus,
  estatus_nuevo     socio_estatus not null,
  motivo            text,
  fecha_efectiva    date,
  cambiado_por      uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index socios_historial_estatus_socio_idx
  on socios_historial_estatus (socio_id, created_at desc);

comment on table socios_historial_estatus is
  'M4 — Bitácora de transiciones de estatus del socio (alta/baja/reactivación/defunción).';

-- ══════════════════════════════════════════════════════════
-- RLS — lectura para miembros; escritura para los mismos roles
-- que pueden editar socios (sec_general/organización/admin).
-- El RPC inserta como INVOKER, así que aplica esta política.
-- ══════════════════════════════════════════════════════════
alter table socios_historial_estatus enable row level security;

create policy "socios_historial_estatus_select_unified" on public."socios_historial_estatus"
  for SELECT to authenticated
  using (
    (private.user_es_miembro())
    or (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

create policy "socios_historial_estatus_insert_unified" on public."socios_historial_estatus"
  for INSERT to authenticated
  with check (
    (private.user_tiene_alguno_de(ARRAY['sec_general'::text, 'sec_organizacion'::text]))
    or (private.user_es_admin_plataforma())
    or (private.user_es_superadmin())
  );

-- ══════════════════════════════════════════════════════════
-- RPC transaccional — valida reglas, actualiza socios y registra
-- el historial. SECURITY INVOKER: respeta la RLS de socios.
-- ══════════════════════════════════════════════════════════
create or replace function public.cambiar_estatus_socio(
  p_socio_id uuid,
  p_nuevo    socio_estatus,
  p_motivo   text default null,
  p_fecha    date default null
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actual socio_estatus;
begin
  select estatus into v_actual from socios where id = p_socio_id;
  if not found then
    raise exception 'Socio no encontrado' using errcode = 'no_data_found';
  end if;
  if v_actual = p_nuevo then
    raise exception 'El socio ya tiene ese estatus' using errcode = '23514';
  end if;

  -- Reglas por estatus destino
  if p_nuevo = 'FALLECIDO' then
    if p_fecha is null then
      raise exception 'La fecha de fallecimiento es obligatoria' using errcode = '23514';
    end if;
    update socios set estatus = p_nuevo, fecha_fallecimiento = p_fecha where id = p_socio_id;

  elsif p_nuevo in ('BAJA_DEFINITIVA', 'BAJA_TEMPORAL') then
    if coalesce(trim(p_motivo), '') = '' then
      raise exception 'El motivo de la baja es obligatorio' using errcode = '23514';
    end if;
    update socios
       set estatus = p_nuevo,
           fecha_baja = coalesce(p_fecha, current_date),
           motivo_baja = p_motivo
     where id = p_socio_id;

  elsif p_nuevo = 'ACTIVO' then
    -- Reactivación: limpia marcas de baja/defunción
    update socios
       set estatus = p_nuevo, fecha_baja = null, motivo_baja = null, fecha_fallecimiento = null
     where id = p_socio_id;

  else  -- NO_PERTENECE u otros
    update socios set estatus = p_nuevo where id = p_socio_id;
  end if;

  insert into socios_historial_estatus (socio_id, estatus_anterior, estatus_nuevo, motivo, fecha_efectiva, cambiado_por)
  values (p_socio_id, v_actual, p_nuevo, nullif(trim(p_motivo), ''), p_fecha, auth.uid());
end;
$$;

grant execute on function public.cambiar_estatus_socio(uuid, socio_estatus, text, date) to authenticated;

comment on function public.cambiar_estatus_socio(uuid, socio_estatus, text, date) is
  'M4 — Cambia el estatus del socio aplicando reglas de negocio y registrando la transición en socios_historial_estatus. Transaccional, SECURITY INVOKER.';

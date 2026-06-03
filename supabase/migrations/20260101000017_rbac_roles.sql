-- ─────────────────────────────────────────────────────────────
-- 017 — RBAC: roles, usuarios y permisos
-- Mapeo de Roles y Responsabilidades.docx
-- ─────────────────────────────────────────────────────────────

-- ── Catálogo de roles ──
create table roles (
  codigo            text primary key,
  nombre            text not null,
  descripcion       text,
  scope_tipo        rol_scope_tipo not null default 'GLOBAL',
  modulos_acceso    jsonb not null default '[]',   -- ej. ["padron","tesoreria"]
  solo_lectura      boolean not null default false,
  orden_jerarquia   int not null default 100,       -- 1 = más alta
  created_at        timestamptz not null default now()
);

-- Seed de los 8 roles del sindicato
insert into roles (codigo, nombre, descripcion, scope_tipo, modulos_acceso, solo_lectura, orden_jerarquia) values
  ('sec_general',     'Secretario General',
   'Convoca juntas, representa al sindicato, firma correspondencia, autoriza datos y ejerce vigilancia de tesorería.',
   'GLOBAL',
   '["mipanel","dashboard","expediente","padron","flota","choferes","polizas","funerario","tesoreria","bitacora","asambleas","honor"]'::jsonb,
   false, 1),

  ('sec_organizacion', 'Secretario de Organización y Propaganda',
   'Lleva registro minucioso de agremiados — altas, bajas, enfermos, incapacitados.',
   'GLOBAL',
   '["mipanel","dashboard","expediente","padron","flota","choferes"]'::jsonb,
   false, 2),

  ('tesorero', 'Secretario Tesorero',
   'Recibe aportaciones, deposita fondos, lleva contabilidad, hace pagos previa autorización, cortes mensuales.',
   'GLOBAL',
   '["mipanel","dashboard","tesoreria","funerario","polizas"]'::jsonb,
   false, 3),

  ('sec_actas', 'Secretario de Actas y Acuerdos',
   'Levanta actas de asambleas, proporciona informes, informes mensuales y entrega de cargo.',
   'GLOBAL',
   '["mipanel","dashboard","asambleas"]'::jsonb,
   false, 4),

  ('sec_trabajo', 'Secretario de Trabajo y Conflictos',
   'Conoce conflictos laborales por área, lleva orden y disciplina, representa en conflictos.',
   'AREA',
   '["mipanel","dashboard","bitacora","expediente"]'::jsonb,
   false, 5),

  ('honor_justicia', 'Comisión de Honor y Justicia',
   'Conoce consignaciones, practica diligencias, dicta resoluciones en máximo 15 días.',
   'GLOBAL',
   '["mipanel","dashboard","honor","expediente"]'::jsonb,
   false, 6),

  ('hacienda', 'Comisión de Hacienda',
   'Vigila el destino del tesoro, revisa y autoriza cortes de caja.',
   'GLOBAL',
   '["mipanel","dashboard","tesoreria","funerario"]'::jsonb,
   true, 7),

  ('delegado', 'Delegado / Jefe de Sitio',
   'Cobra cuotas, aporta personal para eventos, informa novedades cada 15 días, sanciona hasta 3 días.',
   'SITIO',
   '["mipanel","dashboard","padron","flota","choferes","polizas","funerario"]'::jsonb,
   false, 8);

-- ── Perfil de usuario (extiende auth.users de Supabase) ──
create table usuarios_perfil (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  socio_id          uuid references socios(id) on delete set null,
  nombre_display    text not null,
  telefono          text,
  avatar_url        text,
  preferencias      jsonb not null default '{}',  -- dark mode, densidad, etc.
  ultimo_login_at   timestamptz,
  activo            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger up_set_updated_at
  before update on usuarios_perfil
  for each row execute function private.tg_set_updated_at();

-- ── Asignación de roles a usuarios (un usuario puede tener múltiples roles) ──
create table usuarios_roles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  rol_codigo      text not null references roles(codigo) on delete cascade,
  -- Scope opcional para roles AREA / SITIO
  scope_sitio_id  uuid references sitios(id) on delete cascade,
  scope_area_num  int check (scope_area_num between 1 and 8),
  suplente        boolean not null default false,
  desde           date not null default current_date,
  hasta           date,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),

  unique (user_id, rol_codigo, scope_sitio_id, scope_area_num)
);

create index ur_user on usuarios_roles (user_id);
create index ur_rol on usuarios_roles (rol_codigo);
create index ur_activo on usuarios_roles (user_id) where activo = true;

-- ── Trigger: crear perfil automáticamente al crear usuario ──
create or replace function private.tg_handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usuarios_perfil (user_id, nombre_display)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre_display', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.tg_handle_new_user();

-- ── Funciones helper para RLS ──
create or replace function private.user_tiene_rol(p_codigo text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.usuarios_roles
    where user_id = auth.uid()
      and rol_codigo = p_codigo
      and activo = true
      and (hasta is null or hasta >= current_date)
  );
$$;

create or replace function private.user_tiene_alguno_de(p_codigos text[])
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.usuarios_roles
    where user_id = auth.uid()
      and rol_codigo = any(p_codigos)
      and activo = true
      and (hasta is null or hasta >= current_date)
  );
$$;

create or replace function private.user_sitio_scope()
returns uuid language sql stable security definer as $$
  select scope_sitio_id from public.usuarios_roles
  where user_id = auth.uid()
    and rol_codigo = 'delegado'
    and activo = true
    and scope_sitio_id is not null
  limit 1;
$$;

create or replace function private.user_area_scope()
returns int language sql stable security definer as $$
  select scope_area_num from public.usuarios_roles
  where user_id = auth.uid()
    and rol_codigo = 'sec_trabajo'
    and activo = true
    and scope_area_num is not null
  limit 1;
$$;

-- Cualquier rol activo cuenta como "usuario autenticado del sistema"
create or replace function private.user_es_miembro()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.usuarios_roles
    where user_id = auth.uid() and activo = true
  );
$$;

comment on table roles is '8 roles del sindicato definidos en Roles y Responsabilidades.docx.';
comment on table usuarios_perfil is 'Perfil extendido de cada usuario. Se crea automáticamente al registrarse.';
comment on table usuarios_roles is 'Asignación de roles a usuarios con scope opcional (sitio o área).';

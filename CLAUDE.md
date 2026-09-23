# CLAUDE.md — Gobernanza técnica del ERP del Sindicato

Guía para desarrolladores/agentes: qué es el proyecto, cómo está construido y cómo se trabaja en él. Para detalle de un tema, ver los `docs/` enlazados.

## Qué es

ERP de gestión sindical del **Sindicato de Choferes de Automóviles de Sitio y Camiones de Pasajeros de Nuevo Laredo** (representante/Sec. General: Jorge Alberto Hernández González). Contrato: 4 fases base ($52k) + 4 módulos de pago ($46k). **Fase 3 (Expediente Digital) está completa y certificada**; los módulos de pago (Mensualidades/Cobranza, Portal, Alertas, Credenciales) son fase siguiente.

## Stack y estructura

- Monorepo **pnpm + turbo**. Apps: `web` (principal), `admin` (usuarios/roles/branding/auditoría), `mobile` (Expo), `desktop` (Tauri). Packages: `shared`, `db`, `auth`, `ui`.
- **Next.js 16** (App Router, React 19). El middleware se llama `proxy.ts` (convención Next 16).
- **Supabase** (Postgres 17, Auth, Storage, RLS). Cliente vía `@supabase/ssr`.
- Web y admin se despliegan en **Vercel** en cada push a `main` (cada una con su `vercel.json`).

## Convenciones clave (importantes)

- **Migraciones**: SQL numerado en `supabase/migrations/`, aplicado con `pnpm db:migrate` (transaccional por archivo, registrado en `public._meta_migrations`). **Nunca edites una migración ya aplicada; agrega una nueva.**
- **Estado derivado ≠ estado guardado**: todo estado que dependa de "hoy" se **calcula al leer**, no se guarda (p. ej. vigencia de póliza vía `estadoPolizaVigente(fecha)` en `@erp/shared`). Solo se guardan estados que son decisiones humanas (CANCELADA, BAJA, FALLECIDO). Ver `docs/auditoria-datos.md` § "Estados a vigilar". Igual: **concesionario/chofer** se derivan con `clasificarSocio` (`@erp/shared`) — concesionario = es titular de una concesión, chofer = su ocupación lo indica — **no** del `tipo_socio` (que quedó como "categoría especial" opcional). Los flags **SOC_ACT/VEINT/TRAN están deprecados** (se conservan en BD como respaldo; no se usan en la app). Ver `docs/plan-automatizaciones.md`.
- **RBAC**: doble fuente reconciliada — `packages/auth/src/rbac.ts` (matriz) y `roles.modulos_acceso` en la BD. **La BD es la fuente de verdad del menú web** (layout → `AppFrame modulosPorRol`). `expediente` normaliza a `padron`. `pnpm verify:rbac` debe pasar. Roles reales = la directiva (sec_general, sec_actas, sec_organizacion, tesorero, sec_trabajo con `scope_area_num`, honor_justicia, hacienda, delegado) + superadmin/admin_plataforma.
- **Delegados**: se asignan desde el módulo **Sitios** (RPC `asignar_delegado_sitio`), que también configura el rol `delegado` con `usuarios_roles.scope_sitio_id` (RBAC territorial).
- **Impresión/PDF**: grupo de rutas `(print)` con layout mínimo; contenido compartido con las páginas in-app (p. ej. `app/_manual/ManualContent`).
- **Ayuda**: Centro de Ayuda (`/ayuda`) + **Guía contextual** flotante (`GuiaContextual` en `AppFrame`, detecta la sección por ruta).

## Flujo de trabajo

- **Antes de dar por hecho / commitear**, correr las verificaciones y confirmar su salida:
  `pnpm typecheck` (6/6) · `pnpm build` (web+admin) · `pnpm verify:rbac` · `node scripts/verify-fases.mjs`.
- **Acceso a datos en scripts**: `DATABASE_URL` directo a producción (vía `pg`). El MCP de Supabase no siempre está autorizado. **Escribir a producción con scripts ad-hoc puede ser bloqueado por el sandbox**; preferir migraciones (`pnpm db:migrate`) o los scripts `pnpm db:*` existentes.
- **Confirmar antes de escribir a producción.** El usuario prefiere que se avance con un default sensato y solo se pregunte en decisiones irreversibles (ver memoria `preferencia-decidir-sin-preguntar`).

## Modelo de datos (resumen)

`socios` es el eje. Cadena operativa: `socios → concesiones → vehiculos → polizas`; `concesion_choferes` (M:N socio↔concesión); `sitios` (+ delegado). Puentes: `usuarios_perfil.socio_id` (persona↔cuenta) y `usuarios_roles.scope_sitio_id` (delegado ve solo su sitio). Mapa completo: **`docs/modelo-datos.html`**. El **esquema es sólido**; los pendientes son de **calidad de datos** (ver `docs/auditoria-datos.md`): RFC/CURP incompletos, `historial_choferes` vacío (requisito que el cliente quiere poblar), etc.

## Datos fuente y entrega

- Padrones/contrato originales (fuera del repo): `C:\Users\danie\Documents\Sindicato\` (ver memoria `docs-contrato-ruta`).
- Puesta en producción y gestión de cuentas del cliente: **`docs/handover.md`** y **`docs/gestion-cuentas.md`**.

# Entrega (Handover) — Plataforma del Sindicato

> Sindicato de Choferes de Automóviles de Sitio y Camiones de Pasajeros de Nuevo Laredo.
> Estado: **plataforma base entregable**. Este documento resume qué está listo, los pasos
> de seguridad previos a la entrega, y cómo operar la plataforma.

## 1. Estado de la entrega

**✅ Contrato base (Fase 3 — Expediente Digital) — completo y certificado**
- Ciclo de vida del agremiado (alta, edición, flota, bajas/estatus, documentos).
- Verificaciones en verde: `pnpm verify:fases` (36/0), `pnpm verify:rbac`, `pnpm typecheck` (6/6), `pnpm build` (2/2).
- Desplegado en Vercel.

**✅ Valor agregado incluido**
- Tablero interactivo (KPIs clicables, “Requiere atención”, gráficas, indicadores de vencimiento).
- Lista real de Pólizas con estado en tiempo real (derivado por fecha).
- Impresión / PDF de expediente y ficha de vehículo, y manual de usuario.
- Centro de Ayuda + Guía contextual (botón de ayuda en toda la plataforma).
- Rectificación de datos: limpieza de sitios (87→41), 16 delegados asignados, `soc_veint` corregido.

## 2. 🔴 Pasos de seguridad ANTES de entregar (panel de Supabase)

Estos son de configuración (no de código) y **deben hacerse antes de dar acceso al cliente**:

1. **Rotar la contraseña de la base de datos** — la anterior quedó expuesta en el historial de git. *(Prioridad alta.)*
   Supabase → Project Settings → Database → Reset database password. Actualizar `DATABASE_URL` en `.env.local` y en Vercel.
2. **Activar protección de contraseñas filtradas** — Authentication → Providers → Password → “Leaked password protection”.
3. **Fijar la URL del sitio** — Authentication → URL Configuration → Site URL = `https://erp-taxis-web.vercel.app`.

## 3. Cómo operar la plataforma

- **Aplicar cambios de base de datos**: `pnpm db:migrate` (aplica las migraciones nuevas de `supabase/migrations/`, transaccional, idempotente).
- **Desplegar**: cada push a `main` despliega solo en Vercel.
- **Crear la cuenta del administrador del cliente**: registrarlo en Supabase Auth y ligarlo a un socio en `usuarios_perfil`, con rol `superadmin` o `admin_plataforma` en `usuarios_roles`.
- **Roles y permisos**: se administran desde el panel admin; la web respeta lo que se configure (menú y accesos por rol).

## 4. Pendientes documentados (roadmap, NO bloquean la entrega)

Ver [auditoria-datos.md](auditoria-datos.md) y [modelo-datos-reconciliacion.md](modelo-datos-reconciliacion.md):
- Derivar por fecha la vigencia de la **revista vehicular**.
- Reconciliar **RFC/CURP** faltantes desde el padrón fuente (#1 Agremiados).
- Revisar: **3 concesiones VIGENTE con titular fallecido/baja** y **22 contratos de chofer sin vehículo**.
- Guardián `verify:datos` (roza el módulo de Alertas, de pago).

## 5. Módulos de pago (fuera del contrato base)

Mensualidades/Cobranza, Portal del Agremiado, Alertas, Credenciales — disponibles como
siguiente fase. La base actual y la calidad de datos dejan el terreno listo para ellos.

# Entrega (Handover) y puesta en producción

> Sindicato de Choferes de Automóviles de Sitio y Camiones de Pasajeros de Nuevo Laredo.
> Runbook para efectuar la entrega con el cliente. La plataforma base está **completa y certificada**;
> aquí están los pasos de infraestructura, seguridad y cuentas para el **go-live**.

## Estado

**✅ Listo:** Fase 3 (Expediente Digital) certificada (`verify:fases` 36/0, `verify:rbac`, `typecheck` 6/6, `build` 2/2) · tablero interactivo · pólizas con estado en tiempo real · impresión/PDF · Centro de Ayuda + Guía contextual · datos migrados y rectificados · app **web** desplegada en Vercel.

**Infraestructura (ANEXO 1):** Base de datos + servidor nube en **Supabase ≈ $25 USD/mes**, con disponibilidad y respaldos — **costo a cargo del cliente**. (Pasarela de pagos y SMS solo aplican al activar los módulos de pago.)

---

## Proceso de entrega — pasos en orden

### Paso 1 — Infraestructura y pago (Supabase)
1. Subir el proyecto Supabase a **plan Pro (~$25 USD/mes)** → habilita **respaldos automáticos diarios** y evita que la BD se pause por inactividad (el Free tier no sirve para producción).
2. **Titularidad/facturación:** decidir si el proyecto se **transfiere a una organización del cliente** (su tarjeta paga) o lo pagas tú y te reembolsan. Recomendado: organización del cliente, y agregar al desarrollador como colaborador para soporte.
3. Verificar en Supabase que los **respaldos** queden activos.

### Paso 2 — Seguridad (panel de Supabase)
4. **Rotar la contraseña de la base de datos** (la anterior quedó en el historial de git) → actualizar `DATABASE_URL` en `.env.local` y en las variables de Vercel. *(Prioridad alta.)*
5. Activar **protección de contraseñas filtradas** (Authentication → Providers → Password).
6. Fijar **Site URL** (Authentication → URL Configuration) = URL de la web (hoy `https://erp-taxis-web.vercel.app`).
7. *(Recomendado)* Configurar **SMTP propio** para los correos de recuperación (Authentication → SMTP Settings; Resend o SendGrid tienen plan gratuito). Sin esto se usa el correo por defecto de Supabase, con límite bajo y remitente genérico.

### Paso 3 — Desplegar el Panel de Administración
8. El panel `apps/admin` ya tiene su `vercel.json`. Crear un **proyecto Vercel** apuntando a la carpeta `apps/admin`, con las variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.
9. En el proyecto de la **web**, agregar la variable `NEXT_PUBLIC_ADMIN_URL` con la URL del panel admin → así aparece el botón “Abrir panel admin”.

### Paso 4 — Crear la cuenta del administrador del cliente
10. Ejecutar (una sola vez):
    ```
    node scripts/crear-admin.mjs correo@cliente.com "Nombre del Administrador"
    ```
    Entrega las credenciales al cliente. Desde esa cuenta gestionará a los demás.
    Cómo administra cuentas y roles: ver **[gestion-cuentas.md](gestion-cuentas.md)**.

### Paso 5 — Dominio propio *(opcional, recomendado para imagen)*
11. Registrar un dominio (ej. `sindicatochoferesnld.mx`, ~$15/año que paga el cliente), apuntarlo a Vercel (web y admin) y actualizar el **Site URL** en Supabase.

### Paso 6 — Capacitación y cierre
12. Entregar el **manual** (en la plataforma: Ayuda → “Descargar manual PDF”) y la **guía de cuentas** ([gestion-cuentas.md](gestion-cuentas.md)).
13. Sesión breve de capacitación con el administrador del cliente.

---

## Operación continua

- **Cambios de base de datos:** `pnpm db:migrate` (aplica migraciones nuevas, transaccional).
- **Despliegue:** cada push a `main` despliega en Vercel (web y admin).
- **Gestión de cuentas/roles:** desde el Panel de Administración (ver guía).

## Pendientes documentados (roadmap, NO bloquean la entrega)
Ver [auditoria-datos.md](auditoria-datos.md): revista vehicular por fecha · RFC/CURP faltantes · 3 concesiones con titular fallecido · 22 contratos de chofer sin vehículo · guardián `verify:datos`.

## Módulos de pago (siguiente fase, fuera del contrato base)
Mensualidades/Cobranza · Portal del Agremiado · Alertas · Credenciales. La base y la calidad de datos ya dejan el terreno listo para ellos.

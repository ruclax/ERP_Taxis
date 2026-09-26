# Plan: registro sin duplicados + sistema de "datos por completar"

> Objetivo: usar RFC/CURP como llave para no duplicar agremiados, y un sistema que
> muestre a cada rol los datos importantes pendientes de capturar — sin listas manuales.

## Fase A — Registro anti-duplicados (RFC/CURP como llave)
- **RFC y CURP obligatorios** en el alta, con **validación de formato**.
- **Detección en vivo**: al capturar RFC/CURP, si ya existe un agremiado con esa llave →
  aviso inmediato con enlace **"Ir a su perfil"** (verificar/actualizar en vez de duplicar).
- Red de seguridad adicional: chequeo por nombre.
- Aplica a **nuevos** registros; los 483 existentes sin RFC/CURP quedan como "pendientes" (Fase B).

## Fase B — Motor de completitud (datos por completar)
- **Reglas de completitud por entidad** definidas en código (qué campos son importantes):
  - Agremiado: RFC, CURP, teléfono, fecha de nacimiento, domicilio.
  - Vehículo: placas, serie, marca, modelo, año, póliza vigente.
  - Concesión: sitio, vehículo. · Sitio: delegado.
- Se **calcula al vuelo** (derivado, no se guarda): al capturar el dato, el pendiente desaparece solo.
- **Panel "Datos por completar"** (lista accionable con enlace para resolver cada registro).

## Fase C — Tablero por rol
| Rol | Ve |
|---|---|
| **Sec. General** | Solo un **indicador** (conteo): "N expedientes con datos pendientes". |
| **Sec. de Organización** | Lista accionable de agremiados con datos pendientes (es su responsabilidad por estatuto). |
| **Sec. de Trabajo / flota** | Pendientes de vehículos/pólizas. |

Extiende el panel "Requiere atención" ya existente en el tablero.

## Fase D — Revisión del proceso de registro (bug) — RESUELTO
El usuario reportaba **500 ("A server error occurred") al pulsar "Crear socio"**; el socio NO se creaba. Diagnóstico definitivo (reproducido con build de producción local + POST real al Server Action, leyendo el stack del servidor):

- **Causa raíz:** `apps/web/.../padron/nuevo/actions.ts` (archivo `'use server'`) **exportaba un tipo** (`export type { NuevoSocioForm }`). Un módulo `'use server'` **solo puede exportar funciones async** (server actions). El transform de server-actions de Next 16/Turbopack dejaba una referencia al tipo como *valor* en el bundle de producción → **`ReferenceError: NuevoSocioForm is not defined`** al **evaluar el módulo** → 500 en CUALQUIER llamada a `crearSocio`, **antes** de entrar a su `try/catch` (por eso el hardening no ayudaba y el socio nunca se creaba).
- **No lo detectan** `pnpm typecheck` ni `pnpm build` (compilan bien); solo se manifiesta en runtime de producción.
- **Fix:** quitar toda exportación de tipos del archivo `'use server'`; el wizard importa `NuevoSocioForm` desde `@erp/shared/validators` y `CrearSocioResult` dejó de exportarse.
- Verificado: el mismo Server Action pasó de **500 → 200** creando el socio (prueba revertida). `crear_socio_completo` (RPC, SECURITY INVOKER) ya estaba correcto.

## Orden: A → B → C. (RFC/CURP obligatorios sin excepción → sí, por ahora.)

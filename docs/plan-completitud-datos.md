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

## Fase D — Revisión del proceso de registro (bug)
El usuario reporta un error al dar de alta. Diagnóstico:
- El proceso de fondo (`crear_socio_completo`) **funciona** en todos los casos probados (mínimo, con dirección vacía, con concesión) — revertidos, sin guardar.
- La página de alta (server) está correcta.
- **Hallazgo:** si la validación del formulario falla, el alta mostraba solo **"Datos inválidos"** sin decir qué campo → poco útil. **Corregido:** ahora muestra el detalle por campo.
- Pendiente: confirmar con el usuario el mensaje exacto que ve (con el detalle ya visible) para descartar cualquier caso específico.

## Orden: A → B → C. (RFC/CURP obligatorios sin excepción → sí, por ahora.)

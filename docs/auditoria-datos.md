# Auditoría de datos y plan de rectificación

> Diagnóstico BD (producción) vs archivos fuente `C:\Users\danie\Documents\Sindicato\Plataforma admin\`.
> Fecha del diagnóstico: 2026-07-30. **Ningún dato fue modificado al hacer este diagnóstico.**

## Resumen de hallazgos

| # | Hallazgo | Cantidad | Severidad | Fuente para corregir |
|---|---|---|---|---|
| H1 | **Sitios basura** (0 concesiones: duplicados, typos "CHEDRAHUI HIPOPDROMO", "FUNADORES", nombres cortos) | 46 de 87 | 🔴 Alta | — (borrar) |
| H2 | **Delegado embebido** en el nombre del sitio (texto informal) | ~19 de 41 | 🟠 Media | #4 Carros por Sitio |
| H3 | Concesión sin sitio | 1 | 🟡 Baja | #4 |
| H4 | Concesiones **sin vehículo** actual | 49 | 🟠 Media | #3, #4 |
| H5 | Vehículos **sin póliza** | 61 | 🟠 Media | #3 Vehículos y Pólizas |
| H6 | Contratos de chofer activos cuya concesión **no tiene vehículo** | 22 | 🟠 Media | #3/#4 |
| H7 | Vehículos **sin placas** | 17 | 🟡 Baja | #3/#4 |
| H8 | Socios **sin RFC** | 818 de 1249 | 🟠 Media | #1 Agremiados (col RFC parcial) |
| H9 | Socios **sin CURP** | 586 | 🟠 Media | #1 (col CURP parcial) |
| H10 | Socios sin fecha de nacimiento | 80 | 🟡 Baja | #1 |
| H11 | Nombre completo duplicado (homónimo o duplicado real) | 1 grupo | 🟡 Baja | investigar |

### Lo que está SANO (sin acción)
- Cero RFC/CURP duplicados · cero concesiones/placas/series duplicadas.
- Cero vehículos sin concesión · integridad relacional (FKs) correcta.
- 41 sitios reales coinciden con las 43 secciones del archivo #4.

## Mapa de archivos fuente

| # | Archivo | Entidad | Estado |
|---|---|---|---|
| 1 | Padrón de Agremiados | socios | header en fila 2; cols RFC(21)/CURP(13) parciales; encoding CP850 |
| 2 | Padrón de Escalafón | escalafón/orden | fila de título arriba |
| 3 | Vehículos y Pólizas | vehiculos + polizas | header limpio; encoding CP850 |
| 4 | **Carros por Sitio** | sitios ↔ concesiones | **autoritativo de sitios + delegados** (bloques por sitio) |
| 6 | Antidoping | persona/concesión/taxi/**sitio** | columna Sitio en texto libre (origen probable de sitios basura) |
| 7 | Carros Independientes | no-sindicato | 74 filas |

## Plan de acción (por fases)

### Fase 1 — Sitios (rápido, bajo riesgo)
1. **Borrar los 46 sitios basura** — verificar antes que nada los referencie (`usuarios_roles.scope_sitio_id`, `concesiones.sitio_id`). Deja los 41 reales.
2. **Delegados**: extraer el nombre embebido de cada sitio (fuente #4) → hacer *match* con `socios` → **reporte para revisión humana** → asignar vía `asignar_delegado_sitio`.
3. **Normalizar nombres** de sitio (quitar delegado pegado → dejar "NOMBRE (DIRECCIÓN)").
4. Asignar sitio a la 1 concesión huérfana (desde #4).

### Fase 2 — Flota (reconciliar con #3 y #4)
5. **49 concesiones sin vehículo + 61 vehículos sin póliza**: cruzar con #3 → determinar si faltó importar (recuperable) o realmente no hay dato. Re-importar lo recuperable.
6. **22 contratos de chofer** cuya concesión no tiene vehículo: revisar consistencia (¿el carro se dio de baja? ¿falta el vínculo?).
7. **17 vehículos sin placas**: completar desde #3/#4.

### Fase 3 — Socios (reconciliar con #1)
8. **RFC (818) / CURP (586) faltantes**: re-importar desde #1 donde la fuente los tenga (matcheando por nombre/código). Cuantificar primero cuántos son recuperables.
9. Fechas de nacimiento (80), ocupación, estado civil: completar desde #1 donde falte.
10. Investigar el **nombre duplicado** (homónimo vs registro doble).

## Principios de ejecución
- **Nada se escribe sin verificación**: cada paso corre primero en modo *dry-run* (reporte) y se aplica tras tu OK.
- **Matching de nombres = revisión humana** (nombres informales/parciales).
- **Respaldo**: exportar la tabla afectada antes de cada corrección masiva.
- Correcciones idempotentes y en transacción donde aplique.

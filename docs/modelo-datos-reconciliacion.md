# Modelo de datos y estrategia de reconciliación

> Análisis de arquitectura de las fuentes (padrones) vs el modelo de la plataforma.
> Objetivo: aclarar relaciones, identificar duplicación y definir cómo organizarlo — enfoque de backend profesional (Master Data Management).

## 1. El problema real

El padrón se mantuvo como **7 hojas de cálculo independientes**, cada una es una **"vista" distinta de las mismas entidades** (persona, concesión, vehículo, sitio). Se solapan y no comparten una llave única → al importarlas sin reconciliar, la BD heredó duplicados e inconsistencias.

## 2. Entidades reales y llaves de cruce

| Entidad | Llave natural | Llave de cruce entre archivos |
|---|---|---|
| **Socio** (persona) | RFC / CURP (fuerte); nombre (débil) | `nombre` normalizado |
| **Concesión** | `numero_concesion` (27P-####) | **`numero_concesion` (llave primaria de cruce)** |
| **Sitio** | nombre + dirección | nombre normalizado |
| **Vehículo** | `numero_serie` (VIN) / placas | via concesión |
| **Póliza** | número de póliza | via vehículo/concesión |

**La llave que une casi todo es `numero_concesion`.** `nombre` y `taxi` son secundarias (difusas).

## 3. Mapa de duplicación (qué dato vive en qué archivo)

| Dato \ Archivo | #1 Agrem. | #2 Escalafón | #3 Veh/Póliza | #4 Por Sitio | #6 Antidop. | #7 Indep. |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Nombre persona | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `numero_concesion` | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| CURP / credencial | ✓ | ✓ | | | | |
| Licencia conducir | ✓ | ✓ | | | | |
| Teléfono | ✓ | ✓ | | | ✓ | |
| Domicilio | ✓ | ✓ | | | | |
| **RFC** | ✓ | | | | | |
| **Escalafón (No.)** | (categorías) | ✓ | | | | |
| **Sitio** | ✓ | | | ✓ | ✓ | |
| Taxi (#) | | | | ✓ | ✓ | ✓ |
| Vehículo (marca/serie/placas) | | | ✓ | ✓ | | ✓ |
| Póliza | | | ✓ | | | ✓ |
| Concesión metadata (modalidad/fechas) | | | ✓ | | | |
| Antidoping | | | | | ✓ | |

**Focos de conflicto (mismo dato en 3+ archivos):**
- **Sitio** → en #1, #4 y #6 (con formatos distintos: #4 "CENTRAL SENDA (dirección)", #6 "Central Senda"). ← origen de los 46 sitios basura.
- **Vehículo** → en #3, #4 y #7.
- **Persona (subconjunto)** → #1 completo, #2 lo repite parcial.

## 4. Fuente de verdad (canonical) — decisión de arquitectura

| Entidad / campo | Fuente autoritativa | Secundaria (rellenar huecos) |
|---|---|---|
| Persona (datos personales, RFC) | **#1 Agremiados** | #2 |
| Escalafón / orden sindical | **#2 Escalafón** | — |
| Concesión (existencia + modalidad/fechas) | **#3** | #4 |
| Sitio (catálogo + delegado) + concesión↔sitio | **#4 Carros por Sitio** | #6 (solo mapear) |
| Vehículo + Póliza (sindicato) | **#3** | #4 |
| Vehículo + Póliza (independientes) | **#7** | — |
| Antidoping (cumplimiento) | **#6** | — |
| Contactos / domicilio | **#1** | #2 |

## 5. Cómo lo abordaría un backend profesional (pipeline de reconciliación)

Un flujo **staging → normalizar → resolver → validar → upsert**, idempotente y auditable:

1. **Staging** — cargar cada archivo tal cual a una tabla `staging_<archivo>` (crudo, con # de fila). No se toca producción.
2. **Normalización de llaves** — funciones deterministas:
   - `numero_concesion` → formato canónico `27P-0325` (pad, upper, quitar espacios).
   - `nombre` → UPPER, trim, sin acentos, colapsar espacios.
   - `taxi` → entero; `sitio` → nombre normalizado.
3. **Resolución de entidades (master data)**:
   - **Concesión** = única por `numero_concesion` normalizado.
   - **Socio** = único por RFC → CURP → nombre normalizado (los difusos van a revisión).
   - **Sitio** = único por nombre normalizado; **tabla de alias** mapea variantes (#6 "Central Senda" → #4 "CENTRAL SENDA (…)").
4. **Merge por prioridad de fuente** — el canónico gana; los huecos se rellenan de la secundaria; **cada conflicto se registra** (ej. concesión con sitio distinto en #4 vs #6).
5. **Validación** — integridad referencial, sin huérfanos, sin duplicados, formatos.
6. **Upsert idempotente** a las tablas canónicas (transaccional).
7. **Prevención** — constraints e índices únicos para que no vuelva a duplicarse.

## 6. Qué implementaría (concreto)

- **Tablas/ú scripts de staging** por archivo (`scripts/staging/import-*.ts`).
- **Normalizadores** reutilizables (`normalizeConcesion`, `normalizeNombre`) en `packages/shared`.
- **Tabla `sitios_alias`** (variante_texto → sitio_id canónico) para absorber las variantes de #6 y evitar sitios basura futuros.
- **Reporte de reconciliación (dry-run)** — el entregable de revisión: duplicados, conflictos de fuente, y "match sugerido" para nombres difusos. **Nada se aplica sin este reporte + tu OK.**
- **Scripts de upsert idempotentes** por entidad (se corren tras la revisión).
- **Migración de constraints preventivas**: único en `concesiones.numero_concesion` (ya existe), único en sitio por nombre normalizado, y validaciones (`numero_concesion ~ '^27P-\d{4}$'`, etc.).
- **Pipeline repetible**: que la próxima actualización del padrón (2027…) se importe sin volver a duplicar.

## 7. Orden sugerido de ejecución

1. Congelar diagnóstico (este doc) + [auditoria-datos.md](auditoria-datos.md).
2. Staging de los 7 archivos + normalizadores.
3. Reporte de reconciliación (dry-run) por entidad → revisión.
4. Aplicar por fases: **Sitios → Concesiones/Flota → Socios**.
5. Constraints preventivas.
6. (Opcional) módulo de "importar padrón" para futuras actualizaciones.

> Pendiente de lectura profunda: #5 Mensualidades y Accidentes SINDI (formato .xls/.xlsm) — secundarios (tesorería/incidentes).

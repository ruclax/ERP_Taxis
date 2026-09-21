# Plan de automatización de datos ("estados lógicos por reglas de negocio")

> Objetivo: que se actualice **un solo dato en su lugar** (la concesión, la asignación de chofer,
> el cargo del secretario) y **el resto se deduzca o se registre solo**. Elimina la recaptura manual
> y la duplicidad (metodología del ANEXO 1; ver `Daniel.docx`).
>
> Dos mecanismos: **derivar al leer** (estados) y **auto-registrar al cambiar** (historiales).

## Decisiones pendientes de confirmar (dominio) antes de Fase 0
1. **`SOC_VEINT`** = ¿cuota 25% (= `tipo_padron` CUOTA_25)? → para revertir migración 054 correctamente.
2. **SOC_ACT/VEINT/TRAN**: ¿quitar columnas o solo dejar de usarlas/mostrarlas (deprecar)?
3. **`es_chofer`**: derivar de `ocupacion` (contiene "chofer", 917) + `concesion_choferes`. ¿OK?

---

## Fase 0 — Modelo de socios (base; desbloquea el resto)
*Es la corrección de concesionario/chofer/SOC_* que ya acordamos.*

| Acción | Mecanismo | Riesgo |
|---|---|---|
| Revertir migración 054 (soc_veint mal recomputado) | migración | bajo |
| Derivar **es_concesionario** (titular de concesión) y **es_chofer** (ocupación/choferes) | helper + badges | bajo |
| Deprecar **SOC_ACT/SOC_VEINT/SOC_TRAN** → derivar de `estatus` + `tipo_padron` | migración/UI | medio |
| Normalizar `ocupacion` ("CHOFER." → "CHOFER") | migración | bajo |
| **Alta**: quitar default "Concesionario"; agregar "Chofer"; derivar del paso de concesión | UI + RPC | bajo |

> **Bonus:** al derivar `es_concesionario`, los **621 socios mal etiquetados se auto-corrigen** (simplemente dejan de mostrarse como concesionario si no tienen concesión). No hay que tocarlos.

## Fase 1 — Historiales automáticos (prioridad #1 de Daniel)
| Acción | Mecanismo |
|---|---|
| **En qué carro/sitio trabaja cada chofer** (derivado de la asignación vigente) | derivar al leer |
| **`historial_choferes` / `vehiculo_asignaciones`**: registrar fecha al asignar/cambiar chofer o vehículo | auto-registro (RPC/trigger) |
| **Historial de titular de concesión** (cesión/sucesión) al cambiar titular | auto-registro |
| Historial de estatus del socio | ✅ ya existe |

## Fase 2 — Directiva / Secretarios → RBAC automático
| Acción | Mecanismo |
|---|---|
| Pantalla de **Comité/Directiva**: asignar cargo → **rol RBAC automático** (como el delegado) | RPC (patrón `asignar_delegado_sitio`) |
| Área del Sec. de Trabajo (#2–4) → `scope_area_num` | auto |
| **Suplentes** → bandera `suplente` (columna ya existe) | auto |
| Historial de la directiva (quién ocupó cada cargo y cuándo) | auto-registro |

## Fase 3 — Derivaciones restantes (limpieza)
| Acción | Mecanismo |
|---|---|
| Vigencia de **revista vehicular** por fecha | derivar al leer |
| **Antigüedad** derivada de `fecha_ingreso` (retirar columna guardada) | derivar al leer |
| Historial de **delegados del sitio** al cambiar | auto-registro |

## Fuera de la base — rozan módulos de pago
| Automatización | Módulo (pago) |
|---|---|
| **Alertas push** de licencia/póliza/antidoping por vencer | Alertas ($8k) |
| **Morosos / adeudos** derivados por fecha de corte | Mensualidades/Cobranza ($14k) |
| **Gafetes/credenciales** con foto | Credenciales ($6k) |

*(La base ya deja estos estados derivables listos; los módulos son la capa de acción/UI sobre ellos.)*

## Orden sugerido de ejecución
**Fase 0** (corrige el modelo y auto-arregla los 621) → **Fase 1** (lo que Daniel más quiere) → **Fase 2** (directiva→RBAC) → **Fase 3** (limpieza). Todo con verificación (typecheck/build/verify) y confirmación antes de escribir a producción.

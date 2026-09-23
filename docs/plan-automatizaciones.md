# Plan de automatización de datos ("estados lógicos por reglas de negocio")

> Objetivo: que se actualice **un solo dato en su lugar** (la concesión, la asignación de chofer,
> el cargo del secretario) y **el resto se deduzca o se registre solo**. Elimina la recaptura manual
> y la duplicidad (metodología del ANEXO 1; ver `Daniel.docx`).
>
> Dos mecanismos: **derivar al leer** (estados) y **auto-registrar al cambiar** (historiales).

## Decisiones (resueltas)
1. **`SOC_VEINT`**: Daniel.docx no la define → no es requisito. La migración 054 (que la recalculó por antigüedad) quedó **superada/anulada**; se deja tal cual (Opción B, sin re-sincronizar) porque la columna está deprecada y nadie la usa.
2. **SOC_ACT/VEINT/TRAN**: se **deprecan** — se dejan de usar/mostrar en la app, pero se **conservan las columnas** como respaldo histórico.
3. **`es_chofer`**: se deriva de `ocupacion` (contiene "chofer") + `concesion_choferes`. ✅

## Fase 0 — ✅ HECHA
- Alta: `tipo_socio` pasó a "categoría especial" (default OTRO, ya no "Concesionario"); concesionario/chofer se derivan.
- Expediente y lista del Padrón: muestran clasificación **derivada** (Concesionario/Chofer) vía `clasificarSocio` en `@erp/shared`.
- SOC_* fuera de la UI (columna de marcas y filtros/vistas retirados); conservados en BD como respaldo.
- Los **621 mal etiquetados se auto-corrigieron** (ya no se muestran como concesionario si no tienen concesión).

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

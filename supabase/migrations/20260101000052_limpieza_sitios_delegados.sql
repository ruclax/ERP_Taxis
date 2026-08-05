-- Fase 1 de rectificación de datos: limpieza de sitios + asignación de delegados
-- Ver docs/auditoria-datos.md y docs/modelo-datos-reconciliacion.md.
-- migrate.ts aplica cada archivo en su propia transacción (no requiere BEGIN/COMMIT).

-- ============================================================
-- (A) Borrar los 46 sitios "basura": duplicados de nombre corto
--     (provenientes del texto libre de Antidoping), sin concesiones
--     y sin ninguna referencia. Determinista y seguro.
-- ============================================================
DELETE FROM sitios s
WHERE NOT EXISTS (SELECT 1 FROM concesiones c        WHERE c.sitio_id            = s.id)
  AND NOT EXISTS (SELECT 1 FROM usuarios_roles ur    WHERE ur.scope_sitio_id     = s.id)
  AND NOT EXISTS (SELECT 1 FROM mensualidades_cuotas m WHERE m.sitio_id_donde_pago = s.id)
  AND NOT EXISTS (SELECT 1 FROM sanciones_sitio ss   WHERE ss.sitio_id           = s.id)
  AND s.delegado_socio_id IS NULL;

-- ============================================================
-- (B) Asignar 10 delegados con match confiable (exacto/único).
--     El nombre del delegado venía embebido en sitios.nombre; se
--     resolvió contra socios por nombre normalizado. Idempotente:
--     solo asigna si el sitio aún no tiene delegado.
--     Los 8 casos con múltiples candidatos + "DON FILI" quedan
--     pendientes de revisión manual (no se tocan aquí).
-- ============================================================
DO $$
DECLARE
  pares CONSTANT text[][] := ARRAY[
    ['S-MART COLINAS%',                    'AGR-00212'], -- FLORENTINO PASTOR FLORES
    ['CHEDRAUI (AQUILES SERDAN%',          'AGR-00047'], -- BERNARDO ALCARAZ FRAUSTO
    ['FUNDADORES (BLVD%',                  'AGR-00090'], -- VICTOR MANUEL CORTEZ CHAVEZ
    ['HIDALGO (GUERRERO Y GONZALEZ%',      'AGR-00214'], -- LUCIO HERNANDEZ CARDOSO
    ['INDEPENDENCIA (GUERRERO Y DR%',      'AGR-00280'], -- JORGE GUADALUPE GOMEZ LOPEZ
    ['WAL-MART%',                          'AGR-00125'], -- MARCIAL PEREZ ALEMAN
    ['TAMAULIPAS (GUERRERO%',              'AGR-00249'], -- JORGE ALBERTO HERNANDEZ GONZALEZ
    ['TECNOLOGICO (REFORMA%',              'AGR-00273'], -- CAYETANO CASTILLO VEGA
    ['JUAREZ (GUERRERO Y VICTORIA%',       'AGR-00080'], -- FIDEL LUVIANO MATA
    ['LA PAZ (GUERRERO E INDEPENDENCIA%',  'AGR-00358']  -- GUMARO GARCIA MARTINEZ
  ];
  i int;
  v_socio uuid;
  v_rows int;
BEGIN
  FOR i IN 1 .. array_length(pares, 1) LOOP
    SELECT id INTO v_socio FROM socios WHERE codigo_agremiado = pares[i][2];
    IF v_socio IS NULL THEN
      RAISE WARNING 'Delegado no encontrado: %', pares[i][2];
      CONTINUE;
    END IF;

    UPDATE sitios
       SET delegado_socio_id = v_socio
     WHERE nombre LIKE pares[i][1]
       AND delegado_socio_id IS NULL;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE WARNING 'Patron "%" afecto % filas (se esperaba 1)', pares[i][1], v_rows;
    END IF;
  END LOOP;
END $$;

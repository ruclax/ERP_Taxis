-- Fase 1 (ronda 2): 6 delegados desambiguados por membresía de sitio.
-- Cada texto de delegado tenía homónimos; se eligió el socio que ES TITULAR
-- de una concesión en ese mismo sitio (señal fuerte). En 2 casos esto corrigió
-- el match por nombre (CENTRAL SENDA, GUERRERO). Idempotente.

DO $$
DECLARE
  pares CONSTANT text[][] := ARRAY[
    ['ALAMEDA (GUERRERO Y ARTEAGA%',            'AGR-00131'], -- MARCELINO MARTINEZ MARTINEZ
    ['CENTRAL SENDA%',                          'AGR-00132'], -- FELIX ENRIQUE TREVIÑO RODEA
    ['CHEDRAUI HIPODROMO%',                     'AGR-00264'], -- VICTOR FERNANDO GARZA MEDINA
    ['GUERRERO (GUERRERO Y MACLOVIO%',          'AGR-00252'], -- ROBERTO FLORES CEPEDA
    ['LAREDO (CESAR%',                          'AGR-00609'], -- ROGELIO SILVA VILLALOBOS
    ['SAN JOSE (REFORMA%',                      'AGR-00205']  -- ARNULFO GONZALEZ GALICIA
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

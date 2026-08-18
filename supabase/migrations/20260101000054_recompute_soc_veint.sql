-- Rectificación de datos: soc_veint (categoría de veteranía = 20+ años de antigüedad).
-- El flag estaba guardado y se desactualizó: 334 socios ya cumplieron 20 años pero
-- seguían en `false`, y 5 estaban en `true` con menos de 20. Se recalcula desde
-- fecha_ingreso, que ES la definición de la categoría.
--
-- Nota: a diferencia del estado de póliza (que se deriva al leer), soc_veint es una
-- categoría filtrable/editable integrada en filtros, conteos y el alta. Por eso se
-- recomputa-y-guarda aquí. Es una corrección puntual; el desfase futuro (conforme
-- más socios cumplan 20 años) lo detectará el guardián de datos del roadmap.

update socios
   set soc_veint = (extract(year from age(fecha_ingreso)) >= 20)
 where fecha_ingreso is not null
   and soc_veint is distinct from (extract(year from age(fecha_ingreso)) >= 20);

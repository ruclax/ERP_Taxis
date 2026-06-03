-- ─────────────────────────────────────────────────────────────
-- 039 — Reordenar la jerarquía de roles tras agregar
-- superadmin (0) y admin_plataforma (1). Los 8 electos bajan +1.
-- ─────────────────────────────────────────────────────────────

update public.roles set orden_jerarquia = case codigo
  when 'superadmin'         then 0
  when 'admin_plataforma'   then 1
  when 'sec_general'        then 2
  when 'sec_organizacion'   then 3
  when 'tesorero'           then 4
  when 'sec_actas'          then 5
  when 'sec_trabajo'        then 6
  when 'honor_justicia'     then 7
  when 'hacienda'           then 8
  when 'delegado'           then 9
  else orden_jerarquia
end
where codigo in ('superadmin','admin_plataforma','sec_general','sec_organizacion',
                 'tesorero','sec_actas','sec_trabajo','honor_justicia','hacienda','delegado');

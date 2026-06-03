/**
 * Detecta socios potencialmente duplicados.
 *
 * Estrategia:
 *   1. Trae todos los socios con los campos clave.
 *   2. Agrupa por `clave_fuerte` (RFC, CURP) y `clave_blanda` (nombre normalizado).
 *   3. Cada grupo recibe un score de confianza:
 *        - 100  → comparten RFC o CURP
 *        -  85  → nombre + fecha_nacimiento idénticas
 *        -  75  → nombre normalizado + uno tiene RFC y el otro no (probable mismo)
 *        -  60  → solo nombre normalizado coincide
 *   4. Genera reporte JSON con grupos ordenados desc por confianza, incluyendo:
 *        - lista de IDs y datos de cada socio del grupo
 *        - referencias (#concesiones titular, #contratos chofer) para decidir canonical
 *
 * Solo LEE. No modifica nada.
 */

import { pgClient } from './_utils';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface SocioRow {
  id: string;
  rfc: string | null;
  curp: string | null;
  nombre_completo: string;
  fecha_nacimiento: string | null;
  escalafon_numero: number | null;
  tipo_socio: string;
  estatus: string;
  fecha_ingreso: string | null;
  n_concesiones: number;
  n_contratos_chofer: number;
  tiene_contacto: boolean;
  tiene_direccion: boolean;
}

interface Grupo {
  confianza: number;
  motivo: string;
  socios: SocioRow[];
  candidato_canonical_id: string;     // el más "completo"
}

function normalizar(nombre: string): string {
  return nombre
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // quita acentos
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreCompleteness(s: SocioRow): number {
  let n = 0;
  if (s.rfc) n += 30;
  if (s.curp) n += 30;
  if (s.fecha_nacimiento) n += 10;
  if (s.fecha_ingreso) n += 5;
  if (s.escalafon_numero != null) n += 20;
  if (s.tiene_contacto) n += 5;
  if (s.tiene_direccion) n += 5;
  n += s.n_concesiones * 3;
  n += s.n_contratos_chofer * 2;
  return n;
}

async function main() {
  const pg = pgClient();
  await pg.connect();

  console.log('Cargando socios y sus referencias…');
  const sql = `
    select
      s.id, s.rfc, s.curp, s.nombre_completo, s.fecha_nacimiento,
      s.escalafon_numero, s.tipo_socio, s.estatus, s.fecha_ingreso,
      (select count(*) from concesiones c where c.socio_id = s.id) as n_concesiones,
      (select count(*) from concesion_choferes cc where cc.chofer_socio_id = s.id) as n_contratos_chofer,
      exists(select 1 from socios_contactos sc where sc.socio_id = s.id) as tiene_contacto,
      exists(select 1 from socios_direcciones sd where sd.socio_id = s.id) as tiene_direccion
    from socios s
  `;
  const { rows } = await pg.query<SocioRow>(sql);
  console.log(`   ${rows.length} socios totales.`);

  // ── Agrupación ──
  const byRfc = new Map<string, SocioRow[]>();
  const byCurp = new Map<string, SocioRow[]>();
  const byNorm = new Map<string, SocioRow[]>();

  for (const s of rows) {
    if (s.rfc && s.rfc.trim().length >= 10) {
      const k = s.rfc.trim().toUpperCase();
      (byRfc.get(k) ?? byRfc.set(k, []).get(k)!).push(s);
    }
    if (s.curp && s.curp.trim().length >= 16) {
      const k = s.curp.trim().toUpperCase();
      (byCurp.get(k) ?? byCurp.set(k, []).get(k)!).push(s);
    }
    const norm = normalizar(s.nombre_completo);
    if (norm.length >= 6) {
      (byNorm.get(norm) ?? byNorm.set(norm, []).get(norm)!).push(s);
    }
  }

  const grupos: Grupo[] = [];
  const seen = new Set<string>();

  function makeKey(socios: SocioRow[]): string {
    return socios.map((s) => s.id).sort().join('|');
  }

  function pickCanonical(socios: SocioRow[]): string {
    return socios.slice().sort((a, b) => scoreCompleteness(b) - scoreCompleteness(a))[0]!.id;
  }

  // 1) Por RFC
  for (const [k, group] of byRfc) {
    if (group.length < 2) continue;
    const key = makeKey(group);
    if (seen.has(key)) continue;
    seen.add(key);
    grupos.push({
      confianza: 100,
      motivo: `RFC idéntico (${k})`,
      socios: group,
      candidato_canonical_id: pickCanonical(group),
    });
  }
  // 2) Por CURP
  for (const [k, group] of byCurp) {
    if (group.length < 2) continue;
    const key = makeKey(group);
    if (seen.has(key)) continue;
    seen.add(key);
    grupos.push({
      confianza: 100,
      motivo: `CURP idéntica (${k})`,
      socios: group,
      candidato_canonical_id: pickCanonical(group),
    });
  }
  // 3) Por nombre normalizado
  for (const [norm, group] of byNorm) {
    if (group.length < 2) continue;
    const key = makeKey(group);
    if (seen.has(key)) continue;
    seen.add(key);

    // Calcular confianza basada en datos secundarios coincidentes
    const fechas = new Set(group.map((s) => s.fecha_nacimiento).filter(Boolean));
    const conRfc = group.filter((s) => s.rfc).length;
    const conCurp = group.filter((s) => s.curp).length;

    let confianza: number;
    let motivo: string;

    if (fechas.size === 1 && fechas.values().next().value) {
      confianza = 85;
      motivo = `Nombre y fecha de nacimiento idénticas`;
    } else if (conRfc === 0 || conCurp === 0 || (conRfc + conCurp < group.length)) {
      // alguno sin RFC/CURP → es probable que sea el "padrón de choferes" sin esos datos
      confianza = 75;
      motivo = `Nombre idéntico; alguno sin RFC/CURP (posible registro parcial)`;
    } else {
      confianza = 60;
      motivo = `Solo nombre normalizado coincide (posibles personas distintas)`;
    }

    grupos.push({
      confianza,
      motivo,
      socios: group,
      candidato_canonical_id: pickCanonical(group),
    });
  }

  grupos.sort((a, b) => b.confianza - a.confianza);

  // ── Reporte ──
  const reporte = {
    generado_en: new Date().toISOString(),
    socios_totales: rows.length,
    grupos_total: grupos.length,
    por_confianza: {
      alta_100: grupos.filter((g) => g.confianza === 100).length,
      media_85: grupos.filter((g) => g.confianza === 85).length,
      media_75: grupos.filter((g) => g.confianza === 75).length,
      baja_60: grupos.filter((g) => g.confianza === 60).length,
    },
    duplicados_estimados: grupos.reduce((s, g) => s + g.socios.length - 1, 0),
    grupos,
  };

  const outPath = resolve(process.cwd(), 'scripts/duplicados-report.json');
  writeFileSync(outPath, JSON.stringify(reporte, null, 2), 'utf-8');

  console.log('\n📊 Resumen:');
  console.log(`   Socios totales:         ${rows.length}`);
  console.log(`   Grupos con duplicados:  ${grupos.length}`);
  console.log(`   • Confianza 100 (RFC/CURP idéntico):  ${reporte.por_confianza.alta_100}`);
  console.log(`   • Confianza  85 (nombre+fecha nac):   ${reporte.por_confianza.media_85}`);
  console.log(`   • Confianza  75 (nombre, falta dato): ${reporte.por_confianza.media_75}`);
  console.log(`   • Confianza  60 (solo nombre):        ${reporte.por_confianza.baja_60}`);
  console.log(`   Duplicados estimados:   ${reporte.duplicados_estimados}`);
  console.log(`\n📄 Reporte completo:      ${outPath}`);

  // Top 10 muestras para inspección rápida
  console.log('\n🔍 Top 10 grupos (más alta confianza):');
  for (const g of grupos.slice(0, 10)) {
    console.log(`\n  [${g.confianza}] ${g.motivo}`);
    for (const s of g.socios) {
      const isCanon = s.id === g.candidato_canonical_id ? ' ★' : '  ';
      console.log(`    ${isCanon} ${s.nombre_completo}`);
      console.log(`         id=${s.id.slice(0, 8)}…  rfc=${s.rfc ?? '—'}  curp=${s.curp ?? '—'}  esc=${s.escalafon_numero ?? '—'}  conc=${s.n_concesiones}  chof=${s.n_contratos_chofer}`);
    }
  }

  await pg.end();
}

main().catch((e) => {
  console.error('❌', e.message ?? e);
  process.exit(1);
});

/**
 * pnpm db:types
 * Genera packages/db/types/database.ts con los tipos del schema actual.
 * Usa la herramienta `supabase gen types` vía la API REST (no requiere CLI instalada).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { env, log, requireEnv } from './_utils.js';

async function main() {
  log.bold(`\n📝 Generando tipos TypeScript desde Supabase...\n`);
  requireEnv('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');

  const projectRef = env.SUPABASE_URL.match(/https:\/\/([\w-]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    log.err(`No pude extraer project ref de ${env.SUPABASE_URL}`);
    process.exit(1);
  }

  // Endpoint público de Supabase para generar tipos
  const url = `https://api.supabase.com/v1/projects/${projectRef}/types/typescript`;

  log.dim(`   Endpoint: ${url}`);

  // Nota: este endpoint requiere personal access token, no service_role.
  // Como fallback, leemos el schema directamente con pg y generamos un .ts plano.
  // Probamos primero la API oficial si el usuario tiene un access token configurado.
  const personalToken = process.env.SUPABASE_ACCESS_TOKEN;

  let typesContent = '';
  if (personalToken) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${personalToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      typesContent = await res.text();
      log.ok('Tipos generados vía API oficial de Supabase');
    } catch (e: any) {
      log.warn(`API oficial falló (${e.message}). Usando fallback con pg…`);
      typesContent = await generateFromPg();
    }
  } else {
    log.dim('   (SUPABASE_ACCESS_TOKEN no configurado, usando fallback con pg)');
    typesContent = await generateFromPg();
  }

  const outPath = resolve(process.cwd(), 'packages', 'db', 'types', 'database.ts');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, typesContent, 'utf8');
  log.ok(`Tipos escritos en ${outPath}`);
}

async function generateFromPg(): Promise<string> {
  const { pgClient } = await import('./_utils.js');
  const client = pgClient();
  await client.connect();
  try {
    const tablasRes = await client.query(`
      select
        c.table_name,
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        c.column_default
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name not like '\\_meta\\_%'
      order by c.table_name, c.ordinal_position
    `);

    const enumsRes = await client.query(`
      select t.typname, array_agg(e.enumlabel order by e.enumsortorder) as labels
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      group by t.typname
      order by t.typname
    `);

    const enumMap = new Map<string, string[]>();
    for (const r of enumsRes.rows) enumMap.set(r.typname, r.labels);

    const tablesByName = new Map<string, { col: string; tsType: string; nullable: boolean; def: string | null }[]>();
    for (const r of tablasRes.rows) {
      const tsType = pgTypeToTs(r.data_type, r.udt_name, enumMap);
      if (!tablesByName.has(r.table_name)) tablesByName.set(r.table_name, []);
      tablesByName.get(r.table_name)!.push({
        col: r.column_name,
        tsType,
        nullable: r.is_nullable === 'YES',
        def: r.column_default,
      });
    }

    let out = '/* Auto-generado por scripts/generate-types.ts — no editar a mano */\n\n';

    // Enums
    for (const [name, labels] of enumMap.entries()) {
      out += `export type ${pascalCase(name)} = ${labels.map((l) => `'${l}'`).join(' | ')};\n`;
    }
    out += '\n';

    // Tablas
    out += 'export interface Database {\n  public: {\n    Tables: {\n';
    for (const [tName, cols] of tablesByName.entries()) {
      out += `      ${tName}: {\n`;
      out += `        Row: {\n`;
      for (const c of cols) {
        out += `          ${c.col}: ${c.tsType}${c.nullable ? ' | null' : ''};\n`;
      }
      out += `        };\n`;
      out += `        Insert: {\n`;
      for (const c of cols) {
        const optional = c.nullable || c.def !== null;
        out += `          ${c.col}${optional ? '?' : ''}: ${c.tsType}${c.nullable ? ' | null' : ''};\n`;
      }
      out += `        };\n`;
      out += `        Update: Partial<Database['public']['Tables']['${tName}']['Insert']>;\n`;
      out += `      };\n`;
    }
    out += '    };\n    Views: {};\n    Functions: {};\n    Enums: {\n';
    for (const name of enumMap.keys()) {
      out += `      ${name}: ${pascalCase(name)};\n`;
    }
    out += '    };\n  };\n}\n';

    return out;
  } finally {
    await client.end();
  }
}

function pgTypeToTs(dataType: string, udtName: string, enums: Map<string, string[]>): string {
  if (enums.has(udtName)) return pascalCase(udtName);
  switch (dataType) {
    case 'uuid':
    case 'text':
    case 'character varying':
    case 'character':
    case 'date':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
    case 'time with time zone':
    case 'time without time zone':
    case 'inet':
      return 'string';
    case 'integer':
    case 'bigint':
    case 'smallint':
    case 'numeric':
    case 'real':
    case 'double precision':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'json':
    case 'jsonb':
      return 'unknown';
    case 'ARRAY':
      return 'unknown[]';
    default:
      return 'unknown';
  }
}

function pascalCase(s: string): string {
  return s.replace(/(^|_)([a-z])/g, (_, __, c) => c.toUpperCase());
}

main().catch((e) => {
  log.err(`Error inesperado: ${e.message}`);
  process.exit(1);
});

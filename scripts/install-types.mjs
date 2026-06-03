// Helper para des-escapar y mover el archivo de tipos generado.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , src, dst] = process.argv;
const raw = readFileSync(src, 'utf8');

const start = raw.indexOf('export type Json');
const content = raw.slice(start);

// Des-escape: \n → newline, \" → ", \\ → \
let unescaped = content
  .replace(/\\n/g, '\n')
  .replace(/\\"/g, '"')
  .replace(/\\\\/g, '\\');

// Quita el cierre residual del JSON wrapper (' as const"}' o similar)
unescaped = unescaped.replace(/(\}\s*as const)\s*"?\s*\}?\s*$/, '$1\n');

writeFileSync(
  dst,
  '/* Auto-generado por Supabase MCP — no editar a mano */\n\n' + unescaped,
  'utf8'
);

console.log(`Tipos escritos: ${unescaped.length} chars`);

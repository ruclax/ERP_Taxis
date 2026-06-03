'use server';

import { Client } from 'pg';
import { createSupabaseServiceRole, getSuperadminUserOrRedirect } from '@/lib/supabase-server';

async function auth() {
  const { user, isAdmin } = await getSuperadminUserOrRedirect();
  if (!user || !isAdmin) throw new Error('No autorizado');
  return user;
}

const DDL_REGEX = /\b(drop|truncate|delete|alter|create|grant|revoke|insert|update)\b/i;

export async function ejecutarSql(sql: string, confirmado: boolean): Promise<
  | { ok: true; rows: Record<string, unknown>[]; rowCount: number; ms: number; columns: string[] }
  | { ok: false; error: string; needsConfirm?: boolean }
> {
  const user = await auth();
  const trimmed = sql.trim();
  if (!trimmed) return { ok: false, error: 'SQL vacío' };

  const isWrite = DDL_REGEX.test(trimmed);
  if (isWrite && !confirmado) {
    return { ok: false, error: 'Operación de escritura. Confirma para ejecutar.', needsConfirm: true };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  const start = Date.now();
  let result;
  try {
    await client.connect();
    result = await client.query(sql);
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await createSupabaseServiceRole().from('auditoria').insert({
      user_id: user.id,
      user_email: user.email,
      rol_activo: 'superadmin',
      accion: 'SQL_EXEC',
      entidad: 'database',
      entidad_id: 'console',
      valor_despues: { sql: sql.slice(0, 1000) },
      exito: false,
      error_mensaje: errMsg,
    });
    return { ok: false, error: errMsg };
  } finally {
    await client.end();
  }

  const ms = Date.now() - start;
  await createSupabaseServiceRole().from('auditoria').insert({
    user_id: user.id,
    user_email: user.email,
    rol_activo: 'superadmin',
    accion: 'SQL_EXEC',
    entidad: 'database',
    entidad_id: 'console',
    valor_despues: { sql: sql.slice(0, 1000), rows: result.rowCount, ms },
  });

  // El resultado puede ser un array (multi-statement) o un único QueryResult
  const r = Array.isArray(result) ? result[result.length - 1] : result;
  return {
    ok: true,
    rows: (r.rows ?? []) as Record<string, unknown>[],
    rowCount: r.rowCount ?? 0,
    ms,
    columns: (r.fields ?? []).map((f: { name: string }) => f.name),
  };
}

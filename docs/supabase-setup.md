# Configuración de Supabase

Esta guía te indica paso a paso de dónde sacar cada valor que necesita `.env.local`.

## 1. Copia la plantilla

Desde la raíz del repo (`ERP_Taxi/`):

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env.local
```

**Bash:**
```bash
cp .env.example .env.local
```

Ahora abre `.env.local` en tu editor y ve llenando cada variable.

---

## 2. Obtén `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

1. Entra al [Dashboard de Supabase](https://supabase.com/dashboard).
2. Selecciona tu proyecto.
3. Sidebar izquierdo → ⚙️ **Project Settings** → **API**.
4. Copia los siguientes campos:

| Campo en el dashboard | Variable en `.env.local` |
|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **Project API Keys → `anon` `public`** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

> Ambos valores son **seguros** para exponer al cliente (web/móvil); por eso llevan el prefijo `NEXT_PUBLIC_`.

---

## 3. Obtén `SUPABASE_SERVICE_ROLE_KEY` — 🔒 SECRETA

En la misma pantalla **Project Settings → API**, busca:

- **Project API Keys → `service_role` `secret`** → este es el `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **NUNCA expongas esta llave en el cliente.** Solo se usa en scripts del servidor (migraciones, importador, creación de usuarios admin). Da acceso total a la base de datos saltándose las políticas RLS.

Tendrás que dar click en el ojito 👁 para revelarla.

---

## 4. Obtén `DATABASE_URL` (PostgreSQL directo)

Necesario para que los scripts apliquen migraciones SQL directamente al Postgres.

1. Sidebar izquierdo → ⚙️ **Project Settings** → **Database**.
2. Baja hasta la sección **Connection string**.
3. Selecciona el modo **URI**.
4. Elige **Session pooler** (recomendado para scripts; soporta transacciones largas y múltiples queries).
5. Copia la cadena completa. Se verá algo así:
   ```
   postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```
6. **Reemplaza `[YOUR-PASSWORD]`** con la contraseña que estableciste al **crear el proyecto** (la que escribiste en el campo "Database Password").

### ¿Olvidaste la contraseña?

1. Sidebar izquierdo → ⚙️ **Project Settings** → **Database**.
2. Sección **Database password** → **Reset database password**.
3. Genera una nueva, cópiala antes de cerrar la ventana, y pégala en `DATABASE_URL`.

---

## 5. Verifica la conexión

Desde la raíz del repo:

```bash
pnpm db:check
```

**Salida esperada:**
```
✅ Conexión a Supabase exitosa
   URL: https://abcdefghijklmnop.supabase.co
   Postgres: PostgreSQL 15.x on aarch64-unknown-linux-gnu
   Región: aws-0-us-west-1
```

Si falla:
- `connect ECONNREFUSED` → revisa que `DATABASE_URL` esté completa
- `password authentication failed` → la contraseña en `DATABASE_URL` es incorrecta; resetéala
- `ENOTFOUND` → typo en el host (verifica el `project-ref`)
- `Invalid API key` → la `SERVICE_ROLE_KEY` o `ANON_KEY` no es la correcta

---

## 6. Siguiente paso

Una vez que `pnpm db:check` pase, puedes continuar con:

```bash
pnpm db:migrate     # Aplica el esquema completo (18 migraciones)
pnpm db:seed        # Importa los CSVs del padrón
pnpm db:types       # Genera tipos TypeScript desde el schema
pnpm db:admin       # Crea el primer usuario admin (Sec. General)
```

---

## Seguridad

- ✅ `.env.local` está en `.gitignore` desde el primer commit.
- ✅ Solo `.env.example` (sin secretos) se sube al repo.
- ⚠️ Si accidentalmente expusiste `SERVICE_ROLE_KEY` (en un commit, captura, etc.):
  1. Dashboard → **Project Settings** → **API** → **Reset service_role secret**.
  2. Actualiza `.env.local` con la nueva llave.
  3. Considera resetear también el password de la DB.

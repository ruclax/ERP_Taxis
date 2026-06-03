# ERP Taxi — Sindicato de Choferes de Sitio de Nuevo Laredo

Sistema integral de gestión sindical: padrón de socios, flota vehicular, pólizas, tesorería, paquete funerario, asambleas, honor y justicia.

## Plataformas

- **Web** — Next.js 15 (App Router) en Vercel
- **Móvil** — Expo / React Native (Android + iOS) vía EAS Build
- **Escritorio** — Tauri 2 (Windows + macOS + Linux)
- **Backend** — Supabase (PostgreSQL + Auth + Storage)

## Estructura del repositorio

```
ERP_Taxi/
├── apps/
│   ├── web/         # Next.js 15
│   ├── mobile/      # Expo SDK 52
│   └── desktop/     # Tauri 2
├── packages/
│   ├── shared/      # Utilidades, validadores, constantes
│   ├── db/          # Cliente Supabase + queries + tipos
│   ├── auth/        # Hooks de autenticación y RBAC
│   └── ui/          # Componentes compartidos (NativeWind)
├── supabase/
│   └── migrations/  # Esquema SQL versionado
├── scripts/         # CLI tools (migraciones, importador CSV)
├── prototype/       # Prototipo HTML/JSX original (referencia)
├── uploads/         # CSVs fuente del padrón (NO versionados)
└── docs/            # Documentación del proyecto
```

## Setup inicial

1. **Instala pnpm y Node 20+**:
   ```bash
   npm install -g pnpm@9
   ```

2. **Instala dependencias**:
   ```bash
   pnpm install
   ```

3. **Configura Supabase** — sigue [docs/supabase-setup.md](docs/supabase-setup.md) para crear `.env.local` con tus credenciales.

4. **Verifica conexión**:
   ```bash
   pnpm db:check
   ```

5. **Aplica migraciones**:
   ```bash
   pnpm db:migrate
   ```

6. **Carga datos del padrón**:
   ```bash
   pnpm db:seed
   ```

7. **Genera tipos TypeScript**:
   ```bash
   pnpm db:types
   ```

8. **Crea el primer usuario admin**:
   ```bash
   pnpm db:admin
   ```

## Comandos útiles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Levanta todas las apps en modo desarrollo |
| `pnpm --filter web dev` | Solo la app web |
| `pnpm --filter mobile start` | Solo la app móvil (Expo) |
| `pnpm --filter desktop tauri:dev` | Solo la app de escritorio (Tauri) |
| `pnpm build` | Build de producción |
| `pnpm typecheck` | TypeScript en todos los workspaces |
| `pnpm db:migrate` | Aplica migraciones pendientes |
| `pnpm db:reset` | (Dev only) Reinicia el schema |

## Documentación adicional

- [docs/supabase-setup.md](docs/supabase-setup.md) — Configuración paso a paso de Supabase
- [docs/schema.md](docs/schema.md) — Diagrama ER y descripción de tablas
- [docs/rbac.md](docs/rbac.md) — Mapeo de roles y permisos
- [prototype/](prototype/) — Prototipo HTML original (sirve como referencia visual)

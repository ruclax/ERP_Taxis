# ERP — Sindicato de Choferes de Automóviles de Sitio y Camiones de Pasajeros de Nuevo Laredo

Sistema integral de gestión sindical: padrón de agremiados, concesiones, flota vehicular, pólizas, sitios y delegados, tesorería, y áreas de gobernanza (asambleas, honor y justicia, funerario).

> Documentación de gobernanza técnica: **[CLAUDE.md](CLAUDE.md)** (cómo funciona la app y cómo trabajar en ella).

## Plataformas

- **Web** — Next.js 16 (App Router, React 19) en Vercel
- **Panel de administración** — Next.js 16 (app aparte: usuarios, roles, branding, auditoría)
- **Móvil** — Expo / React Native (Android + iOS)
- **Escritorio** — Tauri 2
- **Backend** — Supabase (PostgreSQL 17 + Auth + Storage + RLS)

## Estructura del repositorio

```
ERP_Taxi/
├── apps/
│   ├── web/         # App principal (Next.js 16)
│   ├── admin/       # Panel de administración (Next.js 16)
│   ├── mobile/      # Expo
│   └── desktop/     # Tauri 2
├── packages/
│   ├── shared/      # Utilidades, validadores, formatters, constantes
│   ├── db/          # Cliente Supabase + queries + tipos generados
│   ├── auth/        # RBAC (roles, módulos)
│   └── ui/          # Componentes compartidos
├── supabase/
│   └── migrations/  # Esquema SQL versionado (aplicado con pnpm db:migrate)
├── scripts/         # CLI (migrar, importar CSV, crear usuarios, verificar)
├── prototype/       # Prototipo HTML original (referencia visual)
├── uploads/         # CSVs fuente del padrón (NO versionados)
└── docs/            # Documentación del proyecto
```

## Setup inicial

```bash
npm install -g pnpm@9        # 1. pnpm (Node 20+)
pnpm install                 # 2. dependencias
# 3. crea .env.local siguiendo docs/supabase-setup.md
pnpm db:check                # 4. verifica conexión a Supabase
pnpm db:migrate              # 5. aplica migraciones
pnpm db:seed                 # 6. (opcional) carga datos del padrón
pnpm db:types                # 7. genera tipos TypeScript
pnpm db:admin-plataforma     # 8. crea la cuenta administradora
```

## Comandos útiles

| Comando | Descripción |
|---|---|
| `pnpm --filter web dev` | App web en desarrollo |
| `pnpm --filter admin dev` | Panel admin en desarrollo |
| `pnpm build` | Build de producción (web + admin) |
| `pnpm typecheck` | TypeScript en todos los workspaces |
| `pnpm verify:rbac` | Verifica consistencia RBAC (rbac.ts ↔ tabla `roles`) |
| `pnpm db:migrate` | Aplica migraciones pendientes |
| `pnpm db:superadmin` / `db:admin-plataforma` / `db:admin` | Crea usuarios (god-mode / administrador / Sec. General) |

## Documentación

- **[CLAUDE.md](CLAUDE.md)** — arquitectura, convenciones y flujo de trabajo (empieza aquí).
- [docs/supabase-setup.md](docs/supabase-setup.md) — configuración de `.env.local`.
- [docs/handover.md](docs/handover.md) — entrega y puesta en producción (go-live).
- [docs/gestion-cuentas.md](docs/gestion-cuentas.md) — cómo el cliente administra cuentas y roles.
- [docs/modelo-datos.html](docs/modelo-datos.html) — mapa funcional de la base de datos.
- [docs/modelo-datos-reconciliacion.md](docs/modelo-datos-reconciliacion.md) · [docs/auditoria-datos.md](docs/auditoria-datos.md) — modelo de datos, reconciliación y calidad de datos.

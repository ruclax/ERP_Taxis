# Gestión de cuentas — Guía para el administrador del Sindicato

> Cómo crear y administrar las cuentas de acceso de las personas que usarán la plataforma.
> Esto se hace desde el **Panel de Administración** (una dirección aparte de la plataforma principal).

## Conceptos básicos

- **Usuario** = una persona con correo y contraseña para entrar.
- **Rol** = define qué puede ver y hacer esa persona (p. ej. Tesorero ve Finanzas; un Delegado solo su sitio).
- Una persona puede tener uno o varios roles. Si un módulo no aparece en su menú, es porque su rol no tiene acceso.

## Crear una cuenta nueva

1. Entra al **Panel de Administración** con tu cuenta de administrador.
2. Ve a **Usuarios → Nuevo usuario**.
3. Escribe el **correo** y el **nombre** de la persona y confirma.
4. El sistema **genera una contraseña** y la muestra **una sola vez**: cópiala y entrégasela a la persona.
5. Asígnale su **rol** (ver la tabla abajo).

> La persona entra con esas credenciales y **debe cambiar su contraseña** en **“Mi Panel”**. Si la olvida, puede usar **“Recuperar acceso”** en la pantalla de inicio, o tú puedes **resetearla** desde el panel.

## Asignar o quitar roles

En **Usuarios**, abre la persona y usa **Asignar rol** / **Quitar rol**. Los cambios aplican de inmediato: la próxima vez que la persona recargue, verá (o dejará de ver) los módulos correspondientes.

### Roles disponibles

| Rol | Para quién / qué puede |
|---|---|
| **superadmin** | Control total (normalmente el administrador principal / soporte técnico). |
| **admin_plataforma** | Administra usuarios, roles y configuración de la plataforma. |
| **sec_general** | Secretaría General — acceso amplio a la operación. |
| **sec_organizacion** | Secretaría de Organización — padrón, flota, sitios. |
| **tesorero** / **hacienda** | Finanzas y tesorería. |
| **delegado** | Responsable de **un sitio** — ve solo lo de su sitio. |
| **sec_actas**, **sec_trabajo**, **honor_justicia** | Áreas sindicales específicas. |

> Los módulos exactos de cada rol se pueden ajustar en **Roles** del panel. Regla de oro: **da a cada quien solo el rol que necesita.**

## Caso especial: Delegados de sitio

El rol de **delegado** se asigna de forma más simple desde la **plataforma principal**, no desde el panel:

1. En la plataforma, entra a **Sitios** y abre el sitio.
2. En la tarjeta **Delegado**, busca al socio y asígnalo.
3. Si ese socio **tiene cuenta de usuario**, el sistema le configura automáticamente el rol **delegado** con acceso **solo a su sitio**.

## Dar de baja o pausar una cuenta

- **Desactivar** (recomendado cuando alguien deja el puesto temporalmente): en **Usuarios**, cambia el usuario a **Inactivo**. No podrá entrar, pero su historial se conserva.
- **Eliminar**: borra la cuenta por completo (usar con cuidado; preferir desactivar).
- **Resetear contraseña**: genera una nueva y entrégasela a la persona.

## Buenas prácticas de seguridad

- **Una cuenta por persona.** No compartir usuarios ni contraseñas.
- Entregar la contraseña por un medio seguro y pedir que la **cambien al primer ingreso**.
- **Desactivar** de inmediato a quien deje de laborar.
- Revisar de vez en cuando la lista de usuarios y sus roles.
- Toda acción queda registrada en **Auditoría** (quién hizo qué y cuándo).

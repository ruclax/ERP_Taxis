// Contenido del manual de usuario — fuente única.
// Se usa en /ayuda (dentro de la plataforma) y en /imprimir/manual (PDF para el cliente).

export const SECCIONES = [
  { id: 'bienvenida', titulo: '1. Bienvenida' },
  { id: 'ingresar', titulo: '2. Ingresar a la plataforma' },
  { id: 'cuenta', titulo: '3. Tu cuenta (Mi Panel)' },
  { id: 'menu', titulo: '4. Cómo moverte' },
  { id: 'buscar', titulo: '5. Buscar y filtrar' },
  { id: 'padron', titulo: '6. Agremiados (Padrón)' },
  { id: 'flota', titulo: '7. Flota y Pólizas' },
  { id: 'choferes', titulo: '8. Choferes' },
  { id: 'sitios', titulo: '9. Sitios y delegados' },
  { id: 'tablero', titulo: '10. Tablero' },
  { id: 'imprimir', titulo: '11. Imprimir y guardar en PDF' },
  { id: 'roles', titulo: '12. Roles y permisos' },
  { id: 'soporte', titulo: '13. Soporte' },
];

export default function ManualContent() {
  return (
    <div className="flex flex-col gap-8">
      <Sec id="bienvenida" titulo="1. Bienvenida">
        <P>
          Esta es la plataforma de gestión del <b>Sindicato de Choferes de Sitio de Nuevo Laredo</b>.
          Centraliza el expediente de cada agremiado, sus concesiones, la flota de vehículos, las pólizas
          de seguro, los sitios y sus delegados. El objetivo es tener <b>toda la información en un solo lugar</b>,
          siempre al día y accesible según el rol de cada persona.
        </P>
      </Sec>

      <Sec id="ingresar" titulo="2. Ingresar a la plataforma">
        <Steps>
          <li>Abre la dirección de la plataforma en tu navegador.</li>
          <li>Escribe tu <b>correo</b> y tu <b>contraseña</b>, y presiona <b>Ingresar</b>.</li>
        </Steps>
        <H3>¿Olvidaste tu contraseña?</H3>
        <Steps>
          <li>En la pantalla de acceso, toca <b>“Recuperar acceso”</b>.</li>
          <li>Escribe tu correo. Recibirás un enlace para crear una contraseña nueva.</li>
        </Steps>
        <P className="text-slate-500">Para cerrar sesión, usa <b>Cerrar sesión</b> en la parte inferior del menú lateral.</P>
      </Sec>

      <Sec id="cuenta" titulo="3. Tu cuenta (Mi Panel)">
        <P>En <b>Mi Panel</b> (menú lateral, arriba) puedes:</P>
        <Bullets>
          <li>Actualizar tu nombre y datos de contacto.</li>
          <li>Cambiar tu foto de perfil.</li>
          <li>Cambiar tu contraseña.</li>
        </Bullets>
      </Sec>

      <Sec id="menu" titulo="4. Cómo moverte">
        <P>
          El <b>menú lateral</b> agrupa los módulos por área: <b>Operación</b> (Padrón, Flota, Choferes, Sitios),
          <b> Finanzas</b> (Pólizas, Tesorería) y <b>Gobernanza</b>. En teléfono, el menú se abre con el
          botón <b>☰</b> arriba a la izquierda.
        </P>
        <Nota>Lo que ves en el menú <b>depende de tu rol</b>. Si un módulo no aparece, es porque tu rol no tiene acceso.</Nota>
      </Sec>

      <Sec id="buscar" titulo="5. Buscar y filtrar">
        <P>Las listas (Padrón, Flota) tienen una <b>barra de búsqueda</b> arriba:</P>
        <Bullets>
          <li>Escribe un <b>nombre</b>, <b>placas</b>, número de <b>concesión</b>, <b>RFC</b> o <b>taxi</b>; aparecen sugerencias.</li>
          <li>El botón <b>Filtros</b> abre un panel con filtros detallados y las <b>vistas rápidas</b> (p. ej. “activos”, “por vencer”).</li>
          <li>Los <b>chips</b> muestran los filtros aplicados; toca la ✕ para quitarlos.</li>
        </Bullets>
      </Sec>

      <Sec id="padron" titulo="6. Agremiados (Padrón)">
        <H3>Ver un expediente</H3>
        <Steps>
          <li>Entra a <b>Padrón</b> y busca al agremiado.</li>
          <li>Toca su fila para abrir su <b>expediente</b>.</li>
          <li>Usa las pestañas: <b>General</b>, <b>Concesiones y flota</b>, <b>Documentos</b>, <b>Beneficiarios</b>, <b>Identificaciones</b>.</li>
        </Steps>
        <H3>Dar de alta un socio</H3>
        <Steps>
          <li>En <b>Padrón</b>, toca <b>“Nuevo”</b>.</li>
          <li>Completa el asistente por pasos (datos personales, contacto, categorías) y guarda.</li>
        </Steps>
        <H3>Editar o cambiar estatus (baja, fallecimiento, reactivación)</H3>
        <Steps>
          <li>Dentro del expediente, usa <b>Editar</b> para modificar datos.</li>
          <li>En la pestaña <b>General</b>, el panel <b>Estatus</b> permite registrar bajas, defunción o reactivar, con su motivo e historial.</li>
        </Steps>
        <H3>Imprimir el expediente</H3>
        <Steps>
          <li>En el expediente, toca <b>Imprimir</b> → se abre una vista limpia lista para imprimir o guardar en PDF.</li>
        </Steps>
      </Sec>

      <Sec id="flota" titulo="7. Flota y Pólizas">
        <H3>Vehículos</H3>
        <Steps>
          <li>Entra a <b>Flota</b>; toca una unidad para ver su <b>ficha</b> (datos, concesión, titular, choferes, póliza y documentos).</li>
          <li>Desde la ficha puedes <b>imprimir</b> la información del vehículo.</li>
        </Steps>
        <H3>Pólizas y vencimientos</H3>
        <Bullets>
          <li>En <b>Pólizas</b> verás indicadores: <b>Vencidas</b>, <b>≤10 días</b>, <b>≤30</b>, <b>≤60</b>. Toca uno para ver esa lista.</li>
          <li>El <b>estado</b> de cada póliza (vigente / por vencer / vencida) se calcula <b>automáticamente por su fecha</b>: nunca queda desactualizado.</li>
        </Bullets>
      </Sec>

      <Sec id="choferes" titulo="8. Choferes">
        <P>
          En <b>Choferes</b> ves a quienes manejan las unidades y el estado de su <b>licencia</b>, <b>antidoping</b> y
          <b> póliza</b>. Puedes filtrar, por ejemplo, por “licencia por vencer”.
        </P>
      </Sec>

      <Sec id="sitios" titulo="9. Sitios y delegados">
        <Steps>
          <li>Entra a <b>Sitios</b> para ver todos los sitios y cuántas concesiones tiene cada uno.</li>
          <li>Abre un sitio para ver sus datos y sus concesiones.</li>
          <li>En la tarjeta <b>Delegado</b> puedes <b>asignar, cambiar o quitar</b> al delegado responsable (buscando al socio).</li>
        </Steps>
      </Sec>

      <Sec id="tablero" titulo="10. Tablero">
        <P>El <b>Tablero</b> es tu centro de control:</P>
        <Bullets>
          <li><b>Indicadores (KPIs)</b>: toca uno para ir a su lista (p. ej. Socios → Padrón).</li>
          <li><b>Requiere atención</b>: pendientes accionables (pólizas vencidas, sitios sin delegado…) con enlace directo para resolverlos.</li>
          <li><b>Gráficas</b>: pólizas por vencer por mes, estado de pólizas y altas/bajas del padrón.</li>
          <li><b>Vencimientos de pólizas</b>: indicadores por ventana de días que llevan a la lista filtrada.</li>
        </Bullets>
      </Sec>

      <Sec id="imprimir" titulo="11. Imprimir y guardar en PDF">
        <Steps>
          <li>En un expediente o ficha, toca <b>Imprimir</b>.</li>
          <li>En la vista de impresión, toca <b>“Imprimir / Guardar PDF”</b>.</li>
          <li>En el diálogo del navegador, elige tu impresora <b>o “Guardar como PDF”</b> como destino.</li>
        </Steps>
      </Sec>

      <Sec id="roles" titulo="12. Roles y permisos">
        <P>
          Cada persona tiene un <b>rol</b> que define qué módulos ve y qué puede hacer. Algunos roles son de
          <b> solo lectura</b> (pueden ver pero no modificar) — se marcan con la etiqueta <b>RO</b> en el menú.
          Los administradores gestionan usuarios y roles desde el panel de administración.
        </P>
      </Sec>

      <Sec id="soporte" titulo="13. Soporte">
        <P>
          Si algo no funciona o tienes dudas, contacta al administrador de la plataforma del sindicato.
          Ten a la mano <b>qué pantalla</b> estabas usando y <b>qué esperabas</b> que pasara: eso agiliza la ayuda.
        </P>
      </Sec>
    </div>
  );
}

// ── piezas de presentación ──
function Sec({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 break-inside-avoid">
      <h2 className="mb-3 border-b border-slate-200 pb-1.5 text-lg font-bold text-slate-800">{titulo}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-1 text-sm font-bold uppercase tracking-wide text-slate-500">{children}</h3>;
}
function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}
function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="ml-5 list-decimal space-y-1.5 marker:text-slate-400">{children}</ol>;
}
function Bullets({ children }: { children: React.ReactNode }) {
  return <ul className="ml-5 list-disc space-y-1.5 marker:text-slate-400">{children}</ul>;
}
function Nota({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">💡 {children}</p>;
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Drawer } from '@erp/ui/primitives';
import { HelpCircle, BookOpen, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'erp.guia.v1';

type Guia = { label: string; descripcion: string; tips: string[]; ancla: string };

// Ayuda por sección. `ancla` enlaza a la sección del manual completo en /ayuda.
const GUIAS: Record<string, Guia> = {
  tablero: {
    label: 'Tablero',
    descripcion: 'Tu centro de control: un resumen accionable de todo el sindicato.',
    tips: [
      'Toca un indicador (KPI) para ir directo a su lista.',
      '“Requiere atención” lista pendientes con enlace para resolverlos.',
      'Los indicadores de vencimiento (≤10/30/60 días) abren la lista de pólizas filtrada.',
    ],
    ancla: 'tablero',
  },
  padron: {
    label: 'Agremiados (Padrón)',
    descripcion: 'Directorio de todos los agremiados del sindicato.',
    tips: [
      'Busca por nombre, RFC, concesión o placas; aparecen sugerencias.',
      'El botón “Filtros” abre filtros detallados y las vistas rápidas.',
      'Toca una fila para abrir el expediente. Usa “Nuevo” para dar de alta.',
    ],
    ancla: 'padron',
  },
  'padron-nuevo': {
    label: 'Alta de agremiado',
    descripcion: 'Registro de un nuevo socio, paso a paso.',
    tips: [
      'Completa cada paso del asistente (datos, contacto, categorías).',
      'Puedes avanzar y regresar entre pasos antes de guardar.',
      'Al finalizar, el socio queda con su expediente creado.',
    ],
    ancla: 'padron',
  },
  expediente: {
    label: 'Expediente del agremiado',
    descripcion: 'Toda la información de un socio en un solo lugar.',
    tips: [
      'Usa las pestañas: General, Concesiones y flota, Documentos, Beneficiarios, Identificaciones.',
      '“Editar” modifica datos; el panel “Estatus” registra bajas, defunción o reactivación.',
      'El botón “Imprimir” genera el expediente en PDF.',
    ],
    ancla: 'padron',
  },
  flota: {
    label: 'Flota vehicular',
    descripcion: 'Todas las unidades registradas.',
    tips: [
      'Busca por placas, concesión, VIN o titular.',
      'Toca una unidad para ver su ficha completa.',
      'Filtra por estado (en operación, fuera del sindicato, siniestradas…).',
    ],
    ancla: 'flota',
  },
  vehiculo: {
    label: 'Ficha del vehículo',
    descripcion: 'Detalle de una unidad, su concesión, choferes y póliza.',
    tips: [
      'El estado de la póliza se calcula solo por su fecha (vigente / por vencer / vencida).',
      'Registra o edita el vehículo y la póliza desde sus botones.',
      '“Imprimir” genera la ficha del vehículo en PDF.',
    ],
    ancla: 'flota',
  },
  polizas: {
    label: 'Pólizas y seguros',
    descripcion: 'Vigencias y renovaciones de las pólizas.',
    tips: [
      'Los indicadores (Vencidas, ≤10, ≤30, ≤60 días) filtran la lista al tocarlos.',
      'Cada póliza lleva al vehículo correspondiente.',
      'El estado nunca queda viejo: se deriva de la fecha de vencimiento.',
    ],
    ancla: 'flota',
  },
  choferes: {
    label: 'Choferes',
    descripcion: 'Quienes manejan las unidades y su cumplimiento.',
    tips: [
      'Revisa el estado de licencia, antidoping y póliza de cada chofer.',
      'Filtra, por ejemplo, por “licencia por vencer”.',
    ],
    ancla: 'choferes',
  },
  sitios: {
    label: 'Sitios',
    descripcion: 'Los sitios del sindicato y sus concesiones.',
    tips: [
      'Cada sitio muestra cuántas concesiones tiene y su delegado.',
      'Usa el filtro “Sin delegado” para ver los que faltan asignar.',
      'Toca un sitio para ver su detalle.',
    ],
    ancla: 'sitios',
  },
  sitio: {
    label: 'Detalle del sitio',
    descripcion: 'Datos del sitio, su delegado y sus concesiones.',
    tips: [
      'En la tarjeta “Delegado” puedes asignar, cambiar o quitar al responsable.',
      'La lista muestra las concesiones adscritas al sitio.',
    ],
    ancla: 'sitios',
  },
  cuenta: {
    label: 'Tu cuenta (Mi Panel)',
    descripcion: 'Tus datos personales y seguridad.',
    tips: [
      'Actualiza tu nombre, contacto y foto.',
      'Cambia tu contraseña desde aquí.',
    ],
    ancla: 'cuenta',
  },
  ayuda: {
    label: 'Centro de ayuda',
    descripcion: 'La guía completa de la plataforma.',
    tips: [
      'Navega por el índice lateral por tema.',
      'Descarga el manual completo en PDF con el botón de arriba.',
    ],
    ancla: 'bienvenida',
  },
  general: {
    label: 'Guía',
    descripcion: 'Esta guía está disponible en todas las pantallas.',
    tips: [
      'Ábrela con el botón de ayuda (?) en cualquier momento.',
      'Muestra información de la sección en la que estás.',
    ],
    ancla: 'bienvenida',
  },
};

function seccionDe(p: string): keyof typeof GUIAS {
  if (p.startsWith('/padron/nuevo')) return 'padron-nuevo';
  if (/^\/padron\/[^/]+/.test(p)) return 'expediente';
  if (p.startsWith('/padron')) return 'padron';
  if (/^\/flota\/[^/]+/.test(p)) return 'vehiculo';
  if (p.startsWith('/flota')) return 'flota';
  if (p.startsWith('/polizas')) return 'polizas';
  if (p.startsWith('/choferes')) return 'choferes';
  if (/^\/sitios\/[^/]+/.test(p)) return 'sitio';
  if (p.startsWith('/sitios')) return 'sitios';
  if (p.startsWith('/mipanel')) return 'cuenta';
  if (p.startsWith('/ayuda')) return 'ayuda';
  if (p.startsWith('/dashboard')) return 'tablero';
  return 'general';
}

/** Guía contextual: botón flotante en todas las pantallas + panel con ayuda de la sección actual. */
export default function GuiaContextual() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [primeraVez, setPrimeraVez] = useState(false);

  const g = useMemo(() => GUIAS[seccionDe(pathname ?? '')], [pathname]);

  // Se presenta sola la primera vez (por navegador) para que descubran el botón.
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setPrimeraVez(true);
        setOpen(true);
      }
    } catch { /* localStorage no disponible */ }
  }, []);

  function cerrar() {
    try { window.localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* noop */ }
    setPrimeraVez(false);
    setOpen(false);
  }

  return (
    <>
      {/* Botón flotante — presente en toda la plataforma */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir guía de ayuda"
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 print:hidden"
      >
        <HelpCircle size={18} />
        <span className="hidden sm:inline">Guía</span>
      </button>

      <Drawer open={open} onClose={cerrar} title="Guía" widthClass="w-[360px]">
        <div className="flex flex-col gap-4">
          {primeraVez && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              👋 Bienvenido. Este botón de <b>ayuda</b> está en todas las pantallas y te muestra información de
              la sección en la que estés. Ábrelo cuando tengas dudas.
            </div>
          )}

          <div>
            <div className="label-erp text-slate-400">Estás en</div>
            <h4 className="text-base font-bold text-slate-800">{g.label}</h4>
            <p className="mt-1 text-sm text-slate-600">{g.descripcion}</p>
          </div>

          <ul className="flex flex-col gap-2">
            {g.tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <Link
            href={`/ayuda#${g.ancla}`}
            onClick={cerrar}
            className="mt-1 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <BookOpen size={15} /> Ver manual completo <ArrowRight size={13} className="ml-auto text-slate-400" />
          </Link>
        </div>
      </Drawer>
    </>
  );
}

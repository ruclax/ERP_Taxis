import { Badge } from '../primitives/Badge';
import type { EstatusSocio, EstadoPoliza, EstadoConcesion } from '@erp/db';

export function SocioEstatusPill({ estatus }: { estatus: EstatusSocio | string | null | undefined }) {
  switch (estatus) {
    case 'ACTIVO':           return <Badge tone="success">Activo</Badge>;
    case 'FALLECIDO':        return <Badge tone="critical">✚ Fallecido</Badge>;
    case 'BAJA_DEFINITIVA':  return <Badge tone="critical">Baja definitiva</Badge>;
    case 'BAJA_TEMPORAL':    return <Badge tone="warn">Baja temporal</Badge>;
    case 'NO_PERTENECE':     return <Badge tone="neutral">No pertenece</Badge>;
    default:                 return <Badge tone="neutral">{String(estatus ?? '—')}</Badge>;
  }
}

export function PolizaEstadoPill({ estado }: { estado: EstadoPoliza | string | null | undefined }) {
  switch (estado) {
    case 'VIGENTE':     return <Badge tone="success">Vigente</Badge>;
    case 'POR_VENCER':  return <Badge tone="warn">Por vencer</Badge>;
    case 'VENCIDA':     return <Badge tone="critical">Vencida</Badge>;
    case 'CANCELADA':   return <Badge tone="neutral">Cancelada</Badge>;
    default:            return <Badge tone="neutral">{String(estado ?? '—')}</Badge>;
  }
}

export function ConcesionEstadoPill({ estado }: { estado: EstadoConcesion | string | null | undefined }) {
  switch (estado) {
    case 'VIGENTE':              return <Badge tone="success">Vigente</Badge>;
    case 'BAJA':                 return <Badge tone="critical">Baja</Badge>;
    case 'EN_TRAMITE':           return <Badge tone="warn">En trámite</Badge>;
    case 'CESION_PENDIENTE':     return <Badge tone="warn">Cesión pendiente</Badge>;
    case 'SUCESION_PENDIENTE':   return <Badge tone="warn">Sucesión pendiente</Badge>;
    default:                     return <Badge tone="neutral">{String(estado ?? '—')}</Badge>;
  }
}

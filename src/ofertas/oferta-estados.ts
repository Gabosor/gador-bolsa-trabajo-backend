import { EstadoOferta } from '../common/enums';

const { Borrador, EnRevision, Publicada, EnProceso, Cerrada, Anulada } =
  EstadoOferta;

type Transiciones = Record<EstadoOferta, EstadoOferta[]>;

/** Lo que puede hacer la empresa dueña de la oferta (RF08). */
const TRANSICIONES_EMPRESA: Transiciones = {
  [Borrador]: [EnRevision, Anulada],
  [EnRevision]: [Anulada],
  [Publicada]: [EnProceso, Cerrada, Anulada],
  [EnProceso]: [Cerrada, Anulada],
  [Cerrada]: [],
  [Anulada]: [],
};

/** Lo que puede hacer GADOR. Rechazar una oferta la devuelve a BORRADOR. */
const TRANSICIONES_GADOR: Transiciones = {
  [Borrador]: [Anulada],
  [EnRevision]: [Publicada, Borrador, Anulada],
  [Publicada]: [Anulada],
  [EnProceso]: [Anulada],
  [Cerrada]: [],
  [Anulada]: [],
};

export function puedeCambiarOferta(
  actor: 'EMPRESA' | 'GADOR',
  de: EstadoOferta,
  a: EstadoOferta,
): boolean {
  const tabla =
    actor === 'GADOR' ? TRANSICIONES_GADOR : TRANSICIONES_EMPRESA;
  return tabla[de].includes(a);
}

/** Estados que consumen el cupo de ofertas activas (RF09). */
export const ESTADOS_ACTIVOS = [EnRevision, Publicada, EnProceso];

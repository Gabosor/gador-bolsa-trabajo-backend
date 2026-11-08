import { EstadoPostulacion } from '../common/enums';

const {
  Postulado,
  Visto,
  Preseleccionado,
  Entrevista,
  Finalista,
  Contratado,
  Rechazado,
} = EstadoPostulacion;

/** Flujo de selección de RF11. POSTULADO pasa a VISTO al abrir el perfil. */
const TRANSICIONES: Record<EstadoPostulacion, EstadoPostulacion[]> = {
  [Postulado]: [Visto],
  [Visto]: [Preseleccionado, Rechazado],
  [Preseleccionado]: [Entrevista, Rechazado],
  [Entrevista]: [Finalista, Rechazado],
  [Finalista]: [Contratado, Rechazado],
  [Contratado]: [],
  [Rechazado]: [],
};

export function puedeCambiarPostulacion(
  de: EstadoPostulacion,
  a: EstadoPostulacion,
): boolean {
  return TRANSICIONES[de].includes(a);
}

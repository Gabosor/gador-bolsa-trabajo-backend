import { EstadoEmpresa, EstadoPostulacion } from './enums';

/** Nombres que ve el usuario en correos, WhatsApp y avisos. */
export const NOMBRE_ESTADO_POSTULACION: Record<EstadoPostulacion, string> = {
  [EstadoPostulacion.Postulado]: 'Postulado',
  [EstadoPostulacion.Visto]: 'Visto',
  [EstadoPostulacion.Preseleccionado]: 'Preseleccionado',
  [EstadoPostulacion.Entrevista]: 'Entrevista',
  [EstadoPostulacion.Finalista]: 'Finalista',
  [EstadoPostulacion.Contratado]: 'Contratado',
  [EstadoPostulacion.Rechazado]: 'Rechazado',
};

export const NOMBRE_ESTADO_EMPRESA: Record<EstadoEmpresa, string> = {
  [EstadoEmpresa.Pendiente]: 'pendiente de validación',
  [EstadoEmpresa.Aprobada]: 'aprobada',
  [EstadoEmpresa.Rechazada]: 'rechazada',
  [EstadoEmpresa.Suspendida]: 'suspendida',
};

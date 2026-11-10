/** Transformaciones y mensajes compartidos por los DTO con texto libre. */

type Valor = { value: unknown };

export const recortar = ({ value }: Valor) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Texto largo con formato ligero: unifica los saltos de línea (los
 * formularios multipart llegan con \r\n) y recorta solo los extremos, para
 * no romper la sangría de las listas.
 */
export const normalizarTexto = ({ value }: Valor) =>
  typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : value;

export const normalizarTextoOpcional = (p: Valor) => {
  const valor = normalizarTexto(p);
  return valor === '' ? undefined : valor;
};

export const entre = (campo: string, min: number, max: number) => ({
  message: `${campo} debe tener entre ${min} y ${max} caracteres`,
});

export const hasta = (campo: string, max: number) => ({
  message: `${campo} admite hasta ${max} caracteres`,
});

/** Clave para comparar nombres sin distinguir mayúsculas ni tildes. */
export const clave = (nombre: string) =>
  nombre.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

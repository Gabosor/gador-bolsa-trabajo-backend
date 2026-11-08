export interface HabilidadPostulante {
  habilidadId: number;
  nivel: number;
}

export interface HabilidadRequerida {
  habilidadId: number;
  obligatoria: boolean;
  nivelMinimo: number;
}

/**
 * % MATCH (RF10). Cada habilidad obligatoria pesa 2 y cada deseable 1.
 * Se gana el peso completo si se alcanza el nivel pedido y la mitad si es menor.
 */
export function calcularMatch(
  postulante: HabilidadPostulante[],
  requeridas: HabilidadRequerida[],
): number {
  if (requeridas.length === 0) return 0;
  let pesoTotal = 0;
  let puntos = 0;
  for (const requerida of requeridas) {
    const peso = requerida.obligatoria ? 2 : 1;
    pesoTotal += peso;
    const propia = postulante.find(
      (h) => h.habilidadId === requerida.habilidadId,
    );
    if (propia) {
      puntos += propia.nivel >= requerida.nivelMinimo ? peso : peso / 2;
    }
  }
  return Math.round((puntos / pesoTotal) * 100);
}

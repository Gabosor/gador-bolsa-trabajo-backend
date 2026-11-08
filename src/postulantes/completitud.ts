export interface DatosPerfil {
  direccion: string | null;
  fechaNacimiento: string | null;
  fotoKey: string | null;
  cvKey: string | null;
  idiomas: number;
  formaciones: number;
  experiencias: number;
  habilidades: number;
}

/** Porcentaje de perfil completo (RF02). Los pesos suman 100. */
export function calcularCompletitud(p: DatosPerfil): number {
  let total = 0;
  if (p.direccion && p.fechaNacimiento) total += 15;
  if (p.fotoKey) total += 5;
  if (p.formaciones > 0) total += 20;
  if (p.experiencias > 0) total += 15;
  if (p.habilidades > 0) total += 20;
  if (p.idiomas > 0) total += 5;
  if (p.cvKey) total += 20;
  return total;
}

/** RF10 exige un perfil con más del 80 %. */
export function perfilPuedePostular(porcentaje: number): boolean {
  return porcentaje > 80;
}

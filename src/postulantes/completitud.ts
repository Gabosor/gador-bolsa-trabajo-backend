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

export interface Pendiente {
  clave: string;
  texto: string;
  puntos: number;
}

interface Regla extends Pendiente {
  cumple: (p: DatosPerfil) => boolean;
}

/** Reglas del perfil completo (RF02). Los puntos suman 100. */
const REGLAS: Regla[] = [
  {
    clave: 'cv',
    texto: 'Sube tu CV en PDF',
    puntos: 20,
    cumple: (p) => Boolean(p.cvKey),
  },
  {
    clave: 'formacion',
    texto: 'Agrega tu formación académica',
    puntos: 20,
    cumple: (p) => p.formaciones > 0,
  },
  {
    clave: 'habilidades',
    texto: 'Indica tus habilidades',
    puntos: 20,
    cumple: (p) => p.habilidades > 0,
  },
  {
    clave: 'datos',
    texto: 'Completa tu dirección y fecha de nacimiento',
    puntos: 15,
    cumple: (p) => Boolean(p.direccion && p.fechaNacimiento),
  },
  {
    clave: 'experiencia',
    texto: 'Agrega tu experiencia laboral',
    puntos: 15,
    cumple: (p) => p.experiencias > 0,
  },
  {
    clave: 'foto',
    texto: 'Sube una foto de perfil',
    puntos: 5,
    cumple: (p) => Boolean(p.fotoKey),
  },
  {
    clave: 'idiomas',
    texto: 'Agrega los idiomas que hablas',
    puntos: 5,
    cumple: (p) => p.idiomas > 0,
  },
];

/** Porcentaje de perfil completo (RF02). */
export function calcularCompletitud(p: DatosPerfil): number {
  return REGLAS.reduce(
    (total, regla) => total + (regla.cumple(p) ? regla.puntos : 0),
    0,
  );
}

/** Lo que falta para completar el perfil, de mayor a menor peso. */
export function pendientesPerfil(p: DatosPerfil): Pendiente[] {
  return REGLAS.filter((regla) => !regla.cumple(p)).map(
    ({ clave, texto, puntos }) => ({ clave, texto, puntos }),
  );
}

/** RF10 exige un perfil con más del 80 %. */
export function perfilPuedePostular(porcentaje: number): boolean {
  return porcentaje > 80;
}

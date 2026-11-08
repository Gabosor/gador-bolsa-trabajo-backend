import {
  calcularCompletitud,
  DatosPerfil,
  perfilPuedePostular,
} from './completitud';

const completo: DatosPerfil = {
  direccion: 'Calle Bolívar',
  fechaNacimiento: '2000-01-01',
  fotoKey: 'fotos/a.png',
  cvKey: 'cv/a.pdf',
  idiomas: 1,
  formaciones: 1,
  experiencias: 1,
  habilidades: 1,
};

describe('calcularCompletitud', () => {
  it('da 0 a un perfil vacío', () => {
    expect(
      calcularCompletitud({
        direccion: null,
        fechaNacimiento: null,
        fotoKey: null,
        cvKey: null,
        idiomas: 0,
        formaciones: 0,
        experiencias: 0,
        habilidades: 0,
      }),
    ).toBe(0);
  });

  it('da 100 a un perfil completo', () => {
    expect(calcularCompletitud(completo)).toBe(100);
  });

  it('sin CV queda en 80 y no puede postular', () => {
    const porcentaje = calcularCompletitud({ ...completo, cvKey: null });
    expect(porcentaje).toBe(80);
    expect(perfilPuedePostular(porcentaje)).toBe(false);
  });

  it('un recién titulado sin experiencia sí puede postular', () => {
    const porcentaje = calcularCompletitud({ ...completo, experiencias: 0 });
    expect(porcentaje).toBe(85);
    expect(perfilPuedePostular(porcentaje)).toBe(true);
  });

  it('exige dirección y fecha para los datos personales', () => {
    expect(calcularCompletitud({ ...completo, direccion: null })).toBe(85);
  });
});

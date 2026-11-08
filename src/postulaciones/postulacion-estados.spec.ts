import { EstadoPostulacion } from '../common/enums';
import { puedeCambiarPostulacion } from './postulacion-estados';

const {
  Postulado,
  Visto,
  Preseleccionado,
  Entrevista,
  Finalista,
  Contratado,
  Rechazado,
} = EstadoPostulacion;

describe('puedeCambiarPostulacion', () => {
  it('sigue el flujo completo del PDF', () => {
    const flujo = [
      Postulado,
      Visto,
      Preseleccionado,
      Entrevista,
      Finalista,
      Contratado,
    ];
    for (let i = 0; i < flujo.length - 1; i++) {
      expect(puedeCambiarPostulacion(flujo[i], flujo[i + 1])).toBe(true);
    }
  });

  it('no permite saltar etapas', () => {
    expect(puedeCambiarPostulacion(Visto, Contratado)).toBe(false);
    expect(puedeCambiarPostulacion(Postulado, Preseleccionado)).toBe(false);
  });

  it('no permite rechazar sin haber visto el perfil', () => {
    expect(puedeCambiarPostulacion(Postulado, Rechazado)).toBe(false);
    expect(puedeCambiarPostulacion(Visto, Rechazado)).toBe(true);
  });

  it('no permite salir de un estado final', () => {
    for (const a of Object.values(EstadoPostulacion)) {
      expect(puedeCambiarPostulacion(Contratado, a)).toBe(false);
      expect(puedeCambiarPostulacion(Rechazado, a)).toBe(false);
    }
  });
});

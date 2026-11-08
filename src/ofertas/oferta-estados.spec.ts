import { EstadoOferta } from '../common/enums';
import { puedeCambiarOferta } from './oferta-estados';

const { Borrador, EnRevision, Publicada, EnProceso, Cerrada, Anulada } =
  EstadoOferta;

describe('puedeCambiarOferta', () => {
  it('sigue el flujo completo del PDF', () => {
    expect(puedeCambiarOferta('EMPRESA', Borrador, EnRevision)).toBe(true);
    expect(puedeCambiarOferta('GADOR', EnRevision, Publicada)).toBe(true);
    expect(puedeCambiarOferta('EMPRESA', Publicada, EnProceso)).toBe(true);
    expect(puedeCambiarOferta('EMPRESA', EnProceso, Cerrada)).toBe(true);
  });

  it('impide que la empresa se apruebe su propia oferta', () => {
    expect(puedeCambiarOferta('EMPRESA', EnRevision, Publicada)).toBe(false);
    expect(puedeCambiarOferta('EMPRESA', Borrador, Publicada)).toBe(false);
  });

  it('permite a GADOR rechazar y devolver a borrador', () => {
    expect(puedeCambiarOferta('GADOR', EnRevision, Borrador)).toBe(true);
  });

  it('no permite salir de un estado final', () => {
    for (const a of Object.values(EstadoOferta)) {
      for (const actor of ['EMPRESA', 'GADOR'] as const) {
        expect(puedeCambiarOferta(actor, Cerrada, a)).toBe(false);
        expect(puedeCambiarOferta(actor, Anulada, a)).toBe(false);
      }
    }
  });
});

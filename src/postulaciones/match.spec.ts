import { calcularMatch } from './match';

const obligatoria = { habilidadId: 1, obligatoria: true, nivelMinimo: 2 };
const deseable = { habilidadId: 2, obligatoria: false, nivelMinimo: 1 };

describe('calcularMatch', () => {
  it('da 100 si cumple todo', () => {
    expect(
      calcularMatch(
        [
          { habilidadId: 1, nivel: 3 },
          { habilidadId: 2, nivel: 1 },
        ],
        [obligatoria, deseable],
      ),
    ).toBe(100);
  });

  it('da 0 si no tiene ninguna habilidad pedida', () => {
    expect(
      calcularMatch([{ habilidadId: 9, nivel: 3 }], [obligatoria, deseable]),
    ).toBe(0);
  });

  it('una obligatoria pesa el doble que una deseable', () => {
    expect(
      calcularMatch([{ habilidadId: 1, nivel: 2 }], [obligatoria, deseable]),
    ).toBe(67);
    expect(
      calcularMatch([{ habilidadId: 2, nivel: 1 }], [obligatoria, deseable]),
    ).toBe(33);
  });

  it('da la mitad si el nivel no alcanza', () => {
    expect(calcularMatch([{ habilidadId: 1, nivel: 1 }], [obligatoria])).toBe(
      50,
    );
  });

  it('da 0 si la oferta no define habilidades', () => {
    expect(calcularMatch([{ habilidadId: 1, nivel: 3 }], [])).toBe(0);
  });
});

import { coincideTipoReal } from '../../storage/r2.service';
import { documentoPdf, FIGURAS, logoPng } from './archivos';

// @nestjs/config es solo ESM y Jest no lo carga; aquí no se usa.
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));

describe('archivos de demostración', () => {
  it.each(FIGURAS)('genera un PNG válido con la figura %s', (figura) => {
    const png = logoPng('#1d4ed8', figura);
    expect(coincideTipoReal('image/png', png)).toBe(true);
    // Cabecera IHDR de 256 × 256.
    expect(png.readUInt32BE(16)).toBe(256);
    expect(png.readUInt32BE(20)).toBe(256);
    expect(png.length).toBeLessThan(2 * 1024 * 1024);
  });

  it('cada figura dibuja algo distinto', () => {
    const tamanos = new Set(FIGURAS.map((f) => logoPng('#0f766e', f).length));
    expect(tamanos.size).toBeGreaterThan(1);
  });

  it('genera un PDF válido', async () => {
    const pdf = await documentoPdf('Documento NIT', ['Razón social: Ejemplo']);
    expect(coincideTipoReal('application/pdf', pdf)).toBe(true);
    expect(pdf.length).toBeLessThan(5 * 1024 * 1024);
  });
});

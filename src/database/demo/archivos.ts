import { crc32, deflateSync } from 'node:zlib';
import PDFDocument from 'pdfkit';

/**
 * Archivos de ejemplo para los datos demo: logos geométricos (sin texto ni
 * marcas reales) y PDFs marcados como ficticios. No usan red ni dependencias
 * nuevas.
 */
export const FIGURAS = [
  'montana',
  'edificio',
  'cruz',
  'engranaje',
  'libro',
  'grafico',
  'circulo',
] as const;
export type Figura = (typeof FIGURAS)[number];

const LADO = 256;

type Color = [number, number, number];

function rgb(hex: string): Color {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mezcla con blanco: 0 = color puro, 1 = blanco. */
function aclarar([r, g, b]: Color, t: number): Color {
  return [r, g, b].map((c) => Math.round(c + (255 - c) * t)) as Color;
}

/** Si el punto (x, y), en coordenadas de -1 a 1, pertenece a la figura. */
function dentro(figura: Figura, x: number, y: number): boolean {
  const r = Math.hypot(x, y);
  switch (figura) {
    case 'montana': {
      // Dos picos sobre una base.
      const pico = (cx: number, alto: number) =>
        y > -alto + Math.abs(x - cx) * 1.4 && y < 0.55;
      return pico(-0.2, 0.55) || pico(0.3, 0.3);
    }
    case 'edificio': {
      const barra = (x0: number, x1: number, techo: number) =>
        x > x0 && x < x1 && y > techo && y < 0.6;
      const ventana =
        Math.abs(((x + 1) * 10) % 2) < 0.6 &&
        Math.abs(((y + 1) * 10) % 2) < 0.6;
      return (
        (barra(-0.55, -0.15, -0.2) ||
          barra(-0.1, 0.25, -0.6) ||
          barra(0.3, 0.6, 0)) &&
        !ventana
      );
    }
    case 'cruz':
      return (
        (Math.abs(x) < 0.18 && Math.abs(y) < 0.58) ||
        (Math.abs(y) < 0.18 && Math.abs(x) < 0.58)
      );
    case 'engranaje': {
      const angulo = Math.atan2(y, x);
      const diente = Math.cos(angulo * 8) > 0.3 ? 0.62 : 0.5;
      return r < diente && r > 0.2;
    }
    case 'libro': {
      const hoja = (x0: number, x1: number) =>
        x > x0 && x < x1 && y > -0.45 + Math.abs(x) * 0.15 && y < 0.5;
      return hoja(-0.6, -0.04) || hoja(0.04, 0.6);
    }
    case 'grafico': {
      const barra = (x0: number, alto: number) =>
        x > x0 && x < x0 + 0.26 && y > 0.55 - alto && y < 0.55;
      return barra(-0.6, 0.45) || barra(-0.2, 0.75) || barra(0.2, 1.1);
    }
    case 'circulo':
      return r < 0.58 && !(r < 0.38 && r > 0.22);
  }
}

function bloque(tipo: string, datos: Buffer): Buffer {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const control = Buffer.alloc(4);
  control.writeUInt32BE(crc32(cuerpo) >>> 0);
  return Buffer.concat([largo, cuerpo, control]);
}

/** Logo cuadrado: fondo blanco, recuadro de tono claro y la figura en color. */
export function logoPng(hex: string, figura: Figura): Buffer {
  const color = rgb(hex);
  const fondo = aclarar(color, 0.88);
  const fila = 1 + LADO * 3;
  const pixeles = Buffer.alloc(fila * LADO);
  for (let py = 0; py < LADO; py++) {
    pixeles[py * fila] = 0; // Sin filtro.
    for (let px = 0; px < LADO; px++) {
      const x = (px + 0.5) / (LADO / 2) - 1;
      const y = (py + 0.5) / (LADO / 2) - 1;
      // Recuadro redondeado que deja un margen blanco.
      const esquina = Math.hypot(
        Math.max(Math.abs(x) - 0.7, 0),
        Math.max(Math.abs(y) - 0.7, 0),
      );
      let c: Color = [255, 255, 255];
      if (esquina < 0.22) c = dentro(figura, x, y) ? color : fondo;
      pixeles.set(c, py * fila + 1 + px * 3);
    }
  }
  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(LADO, 0);
  cabecera.writeUInt32BE(LADO, 4);
  cabecera[8] = 8; // Bits por canal.
  cabecera[9] = 2; // RGB.
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque('IHDR', cabecera),
    bloque('IDAT', deflateSync(pixeles)),
    bloque('IEND', Buffer.alloc(0)),
  ]);
}

/** PDF de una página, con la marca de documento ficticio bien visible. */
export function documentoPdf(
  titulo: string,
  lineas: string[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 60 });
    const partes: Buffer[] = [];
    doc.on('data', (parte: Buffer) => partes.push(parte));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    doc
      .rect(0, 0, doc.page.width, 40)
      .fill('#B91C1C')
      .fillColor('#FFFFFF')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('DOCUMENTO FICTICIO DE DEMOSTRACIÓN — SIN VALIDEZ', 60, 14, {
        align: 'center',
        width: doc.page.width - 120,
      });
    doc.fillColor('#111827').fontSize(20).text(titulo, 60, 80).moveDown();
    doc.font('Helvetica').fontSize(12);
    for (const linea of lineas) doc.text(linea).moveDown(0.4);
    doc
      .moveDown(2)
      .fillColor('#6B7280')
      .fontSize(10)
      .text(
        'Generado automáticamente para probar la Bolsa de Trabajo. Los datos son inventados.',
      );
    doc.end();
  });
}

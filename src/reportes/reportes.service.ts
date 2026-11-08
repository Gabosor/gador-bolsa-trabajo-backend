import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { DataSource } from 'typeorm';
import { hoyBolivia } from '../common/fechas';
import { Formato, ReporteDto } from './dto/reporte.dto';

export enum TipoReporte {
  Empresas = 'empresas',
  Postulantes = 'postulantes',
  Ofertas = 'ofertas',
  Contrataciones = 'contrataciones',
}

interface Definicion {
  titulo: string;
  columnas: { titulo: string; ancho: number }[];
  /** El orden de las columnas del SELECT es el orden del reporte. */
  sql: string;
}

const ZONA = `'America/La_Paz'`;

/** RF14: para agregar un reporte basta con agregar una entrada aquí. */
const REPORTES: Record<TipoReporte, Definicion> = {
  [TipoReporte.Empresas]: {
    titulo: 'Reporte de empresas',
    columnas: [
      { titulo: 'NIT', ancho: 16 },
      { titulo: 'Razón social', ancho: 44 },
      { titulo: 'Rubro', ancho: 20 },
      { titulo: 'Estado', ancho: 24 },
    ],
    sql: `SELECT e.nit, e.razon_social, c.nombre AS rubro, e.estado
          FROM empresas e JOIN catalogos c ON c.id = e.rubro_id
          ORDER BY e.razon_social`,
  },
  [TipoReporte.Postulantes]: {
    titulo: 'Reporte de postulantes',
    columnas: [
      { titulo: 'CI', ancho: 14 },
      { titulo: 'Nombre', ancho: 36 },
      { titulo: 'Profesión', ancho: 44 },
      { titulo: 'Celular', ancho: 14 },
    ],
    sql: `SELECT u.ci, u.nombre_completo,
            coalesce(string_agg(DISTINCT c.nombre, ', '), 'Sin registrar') AS profesion,
            u.celular
          FROM users u
          JOIN roles r ON r.id = u.role_id AND r.nombre = 'POSTULANTE'
          LEFT JOIN postulante_profiles p ON p.user_id = u.id
          LEFT JOIN formaciones f ON f.profile_id = p.id
          LEFT JOIN catalogos c ON c.id = f.profesion_id
          GROUP BY u.id ORDER BY u.nombre_completo`,
  },
  [TipoReporte.Ofertas]: {
    titulo: 'Reporte de ofertas por fecha',
    columnas: [
      { titulo: 'Fecha', ancho: 12 },
      { titulo: 'Oferta', ancho: 38 },
      { titulo: 'Empresa', ancho: 32 },
      { titulo: 'Estado', ancho: 24 },
      { titulo: 'Cierre', ancho: 12 },
      { titulo: 'Postulantes', ancho: 12 },
    ],
    sql: `SELECT to_char(o.created_at AT TIME ZONE ${ZONA}, 'YYYY-MM-DD') AS fecha,
            o.titulo, e.razon_social, o.estado,
            to_char(o.fecha_cierre, 'YYYY-MM-DD') AS cierre,
            (SELECT count(*)::int FROM postulaciones p WHERE p.oferta_id = o.id) AS postulantes
          FROM ofertas o JOIN empresas e ON e.id = o.empresa_id
          WHERE (o.created_at AT TIME ZONE ${ZONA})::date
            BETWEEN coalesce($1::date, '-infinity') AND coalesce($2::date, 'infinity')
          ORDER BY o.created_at DESC`,
  },
  [TipoReporte.Contrataciones]: {
    titulo: 'Reporte de contrataciones por empresa',
    columnas: [
      { titulo: 'NIT', ancho: 16 },
      { titulo: 'Empresa', ancho: 50 },
      { titulo: 'Postulaciones', ancho: 16 },
      { titulo: 'Contratados', ancho: 14 },
    ],
    sql: `SELECT e.nit, e.razon_social, count(p.id)::int AS postulaciones,
            count(p.id) FILTER (WHERE p.estado = 'CONTRATADO')::int AS contratados
          FROM empresas e
          JOIN ofertas o ON o.empresa_id = e.id
          JOIN postulaciones p ON p.oferta_id = o.id
          GROUP BY e.id ORDER BY contratados DESC, e.razon_social`,
  },
};

const GUINDA = '#73141F';
const MEMBRETE = [
  'GOBIERNO AUTÓNOMO DEPARTAMENTAL DE ORURO',
  'SECRETARÍA DEPARTAMENTAL DE PLANIFICACIÓN Y DESARROLLO',
  'UNIDAD DE SISTEMAS E INFORMÁTICA - G.A.D.O.R.',
];

type Fila = (string | number | null)[];

@Injectable()
export class ReportesService {
  constructor(private readonly dataSource: DataSource) {}

  async generar(tipo: TipoReporte, dto: ReporteDto) {
    const definicion = REPORTES[tipo];
    const parametros =
      tipo === TipoReporte.Ofertas
        ? [dto.desde ?? null, dto.hasta ?? null]
        : [];
    const registros = await this.dataSource.query<Record<string, unknown>[]>(
      definicion.sql,
      parametros,
    );
    const filas = registros.map((r) => Object.values(r) as Fila);
    return this.aArchivo(dto.formato, definicion, filas, dto);
  }

  private async aArchivo(
    formato: Formato,
    definicion: Definicion,
    filas: Fila[],
    dto: ReporteDto,
  ): Promise<Buffer> {
    const periodo =
      dto.desde || dto.hasta
        ? ` · Periodo: ${dto.desde ?? 'inicio'} a ${dto.hasta ?? 'hoy'}`
        : '';
    const subtitulo = `Generado el ${hoyBolivia()}${periodo} · ${filas.length} registro(s)`;
    return formato === 'excel'
      ? this.aExcel(definicion, filas, subtitulo)
      : this.aPdf(definicion, filas, subtitulo);
  }

  private async aExcel(
    { titulo, columnas }: Definicion,
    filas: Fila[],
    subtitulo: string,
  ): Promise<Buffer> {
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet('Reporte');
    hoja.columns = columnas.map((c) => ({ width: c.ancho }));
    const relleno: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF73141F' },
    };

    [...MEMBRETE, titulo, subtitulo].forEach((texto, i) => {
      const fila = i + 1;
      hoja.mergeCells(fila, 1, fila, columnas.length);
      const celda = hoja.getCell(fila, 1);
      celda.value = texto;
      if (i < MEMBRETE.length) {
        celda.fill = relleno;
        celda.font = { bold: i === 0, color: { argb: 'FFFFFFFF' } };
      } else if (i === MEMBRETE.length) {
        celda.font = { bold: true, size: 14, color: { argb: 'FF73141F' } };
      }
    });

    const encabezado = hoja.getRow(MEMBRETE.length + 3);
    encabezado.values = columnas.map((c) => c.titulo);
    encabezado.eachCell((celda) => {
      celda.fill = relleno;
      celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });
    hoja.addRows(filas);
    return Buffer.from(await libro.xlsx.writeBuffer());
  }

  private aPdf(
    { titulo, columnas }: Definicion,
    filas: Fila[],
    subtitulo: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 40,
        bufferPages: true,
      });
      const partes: Buffer[] = [];
      doc.on('data', (parte: Buffer) => partes.push(parte));
      doc.on('end', () => resolve(Buffer.concat(partes)));
      doc.on('error', reject);

      const margen = 40;
      const anchoUtil = doc.page.width - margen * 2;
      const totalAnchos = columnas.reduce((s, c) => s + c.ancho, 0);
      const anchos = columnas.map((c) => (c.ancho / totalAnchos) * anchoUtil);
      const limite = doc.page.height - 50;

      /** Escribe una fila y devuelve la altura que ocupó. */
      const dibujarFila = (celdas: Fila, y: number) => {
        let x = margen;
        celdas.forEach((celda, i) => {
          doc.text(String(celda ?? ''), x + 4, y + 4, { width: anchos[i] - 8 });
          x += anchos[i];
        });
      };
      const altoFila = (celdas: Fila) =>
        8 +
        Math.max(
          ...celdas.map((celda, i) =>
            doc.heightOfString(String(celda ?? ''), { width: anchos[i] - 8 }),
          ),
        );

      /** Membrete y títulos, repetidos en cada página. */
      const encabezado = (): number => {
        doc.rect(0, 0, doc.page.width, 70).fill(GUINDA).fillColor('white');
        doc.font('Helvetica-Bold').fontSize(11).text(MEMBRETE[0], margen, 14);
        doc.font('Helvetica').fontSize(9);
        doc.text(MEMBRETE[1], margen, 32).text(MEMBRETE[2], margen, 46);
        doc
          .font('Helvetica-Bold')
          .fontSize(13)
          .text('G.A.D.O.R.', margen, 24, { width: anchoUtil, align: 'right' });
        doc.fillColor(GUINDA).fontSize(14).text(titulo, margen, 84);
        doc.fillColor('#444444').font('Helvetica').fontSize(9);
        doc.text(subtitulo, margen, 104);

        const titulos = columnas.map((c) => c.titulo);
        doc.font('Helvetica-Bold');
        const alto = altoFila(titulos);
        doc.rect(margen, 122, anchoUtil, alto).fill(GUINDA).fillColor('white');
        dibujarFila(titulos, 122);
        doc.font('Helvetica').fillColor('black');
        return 122 + alto;
      };

      let y = encabezado();
      if (filas.length === 0) doc.text('Sin registros.', margen, y + 8);
      for (const fila of filas) {
        const alto = altoFila(fila);
        if (y + alto > limite) {
          doc.addPage();
          y = encabezado();
        }
        dibujarFila(fila, y);
        doc
          .moveTo(margen, y + alto)
          .lineTo(margen + anchoUtil, y + alto)
          .strokeColor('#DDDDDD')
          .stroke();
        y += alto;
      }

      const { count } = doc.bufferedPageRange();
      for (let i = 0; i < count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc
          .fillColor('#666666')
          .fontSize(8)
          .text(
            `Bolsa de Trabajo Departamental Digital · Página ${i + 1} de ${count}`,
            margen,
            doc.page.height - 30,
            { width: anchoUtil, align: 'center', lineBreak: false },
          );
      }
      doc.end();
    });
  }
}

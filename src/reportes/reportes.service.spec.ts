import * as ExcelJS from 'exceljs';
import { DataSource } from 'typeorm';
import { ReporteDto } from './dto/reporte.dto';
import { ReportesService, TipoReporte } from './reportes.service';

const filas = Array.from({ length: 60 }, (_, i) => ({
  nit: `10${i}`,
  razon_social: `Empresa de prueba número ${i}`,
  rubro: 'Minería',
  estado: 'APROBADA',
}));

const crearServicio = () =>
  new ReportesService({
    query: jest.fn().mockResolvedValue(filas),
  } as unknown as DataSource);

const dto = (formato: 'pdf' | 'excel') => ({ formato }) as ReporteDto;

const contar = (texto: string, patron: RegExp) =>
  (texto.match(patron) ?? []).length;

describe('ReportesService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('el PDF lleva el escudo una sola vez aunque tenga varias páginas', async () => {
    const pdf = await crearServicio().generar(TipoReporte.Empresas, dto('pdf'));
    const texto = pdf.toString('latin1');
    expect(texto.startsWith('%PDF')).toBe(true);
    expect(contar(texto, /\/Type \/Page[^s]/g)).toBeGreaterThan(1);
    expect(contar(texto, /\/Subtype \/Image/g)).toBe(1);
  });

  it('el Excel lleva el escudo en la esquina del membrete', async () => {
    const buffer = await crearServicio().generar(
      TipoReporte.Empresas,
      dto('excel'),
    );
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(buffer as unknown as ArrayBuffer);
    const hoja = libro.getWorksheet('Reporte')!;
    expect(hoja.getImages()).toHaveLength(1);
    expect(hoja.getCell(1, 2).value).toBe(
      'GOBIERNO AUTÓNOMO DEPARTAMENTAL DE ORURO',
    );
    expect(hoja.getCell(3, 1).isMerged).toBe(true);
    expect(hoja.getCell(6, 1).value).toBe('NIT');
  });

  it('sin el escudo los reportes se generan igual', async () => {
    jest
      .spyOn(
        ReportesService.prototype as unknown as { leerEscudo(): null },
        'leerEscudo',
      )
      .mockReturnValue(null);
    const servicio = crearServicio();
    const pdf = await servicio.generar(TipoReporte.Empresas, dto('pdf'));
    expect(contar(pdf.toString('latin1'), /\/Subtype \/Image/g)).toBe(0);

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(
      (await servicio.generar(
        TipoReporte.Empresas,
        dto('excel'),
      )) as unknown as ArrayBuffer,
    );
    const hoja = libro.getWorksheet('Reporte')!;
    expect(hoja.getImages()).toHaveLength(0);
    expect(hoja.getCell(1, 1).value).toBe(
      'GOBIERNO AUTÓNOMO DEPARTAMENTAL DE ORURO',
    );
  });
});

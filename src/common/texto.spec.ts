import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { GuardarOfertaDto } from '../ofertas/dto/oferta.dto';
import { normalizarTexto, normalizarTextoOpcional, recortar } from './texto';

describe('texto', () => {
  it('recorta solo cadenas', () => {
    expect(recortar({ value: '  a  ' })).toBe('a');
    expect(recortar({ value: 3 })).toBe(3);
  });

  it('normaliza saltos de Windows y recorta el texto completo, no cada línea', () => {
    expect(normalizarTexto({ value: '  - uno\r\n  - dos\r\n' })).toBe(
      '- uno\n  - dos',
    );
    expect(normalizarTexto({ value: 'a\rb' })).toBe('a\nb');
  });

  it('un texto opcional vacío pasa a undefined', () => {
    expect(normalizarTextoOpcional({ value: '   \r\n ' })).toBeUndefined();
    expect(normalizarTextoOpcional({ value: ' x ' })).toBe('x');
  });

  it('una descripción de solo espacios no pasa y el mensaje está en español', () => {
    const dto = plainToInstance(GuardarOfertaDto, {
      descripcion: '            ',
    });
    const error = validateSync(dto).find((e) => e.property === 'descripcion');
    expect(Object.values(error?.constraints ?? {})).toContain(
      'La descripción debe tener entre 10 y 10000 caracteres',
    );
  });
});

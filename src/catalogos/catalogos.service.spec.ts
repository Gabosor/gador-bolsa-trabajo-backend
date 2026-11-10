import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TipoCatalogo } from '../common/enums';
import { CatalogosService } from './catalogos.service';
import { Catalogo } from './entities/catalogo.entity';
import { Habilidad } from './entities/habilidad.entity';

// @nestjs/typeorm se publica como ESM y Jest no lo carga en CommonJS.
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

const habilidades = [
  { id: 1, nombre: 'AutoCAD', activo: true },
  { id: 2, nombre: 'Topografía', activo: true },
  { id: 3, nombre: 'Flash', activo: false },
] as Habilidad[];

const crear = (catalogo: Partial<Catalogo> | null = null) =>
  new CatalogosService(
    {
      findOneBy: jest.fn().mockResolvedValue(catalogo),
    } as unknown as Repository<Catalogo>,
    {
      findBy: jest.fn(({ id }: { id: { value: number[] } }) =>
        Promise.resolve(habilidades.filter((h) => id.value.includes(h.id))),
      ),
    } as unknown as Repository<Habilidad>,
  );

describe('CatalogosService', () => {
  it('devuelve las habilidades activas en el orden pedido', async () => {
    const encontradas = await crear().exigirHabilidades([2, 1]);
    expect(encontradas.map((h) => h.id)).toEqual([2, 1]);
  });

  it('nombra las habilidades desactivadas para que se puedan quitar', async () => {
    await expect(crear().exigirHabilidades([1, 3])).rejects.toThrow(
      'Estas habilidades ya no están disponibles: Flash. Quítalas para continuar.',
    );
  });

  it('rechaza ids que no existen y repetidos', async () => {
    await expect(crear().exigirHabilidades([1, 99])).rejects.toThrow(
      BadRequestException,
    );
    await expect(crear().exigirHabilidades([1, 1])).rejects.toThrow(
      'Hay habilidades repetidas',
    );
  });

  it('explica en español cuando un catálogo está desactivado', async () => {
    const servicio = crear({
      id: 7,
      nombre: 'Ingeniería Textil',
      tipo: TipoCatalogo.Profesion,
      activo: false,
    });
    await expect(servicio.exigir(7, TipoCatalogo.Profesion)).rejects.toThrow(
      'La profesión «Ingeniería Textil» ya no está disponible. Quítala para continuar.',
    );
  });

  it('explica en español cuando un catálogo no existe', async () => {
    await expect(crear().exigir(7, TipoCatalogo.Municipio)).rejects.toThrow(
      'El municipio elegido no es válido',
    );
  });
});

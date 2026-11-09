import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../auditoria/audit.service';
import { TipoCatalogo } from '../common/enums';
import { CatalogosAdminService } from './catalogos-admin.service';
import { Catalogo } from './entities/catalogo.entity';
import { Configuracion } from './entities/configuracion.entity';
import { Habilidad } from './entities/habilidad.entity';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

const item = (
  id: number,
  tipo: TipoCatalogo,
  nombre: string,
  parent: Catalogo | null = null,
) => ({ id, tipo, nombre, parent, activo: true }) as Catalogo;

const construccion = item(1, TipoCatalogo.Area, 'Construcción');
const mineria = item(2, TipoCatalogo.Area, 'Minería');
const oruro = item(3, TipoCatalogo.Departamento, 'Oruro');
const civil = item(
  10,
  TipoCatalogo.Profesion,
  'Ingeniería Civil',
  construccion,
);
const catalogo = [construccion, mineria, oruro, civil];
const habilidades = [
  { id: 20, nombre: 'AutoCAD', activo: true, area: construccion },
] as Habilidad[];

function preparar() {
  const auditoria = jest.fn();
  const guardados: unknown[] = [];
  const servicio = new CatalogosAdminService(
    {
      find: jest.fn(({ where }: { where: { tipo: TipoCatalogo } }) =>
        Promise.resolve(catalogo.filter((c) => c.tipo === where.tipo)),
      ),
      findOne: jest.fn(({ where }: { where: { id: number } }) =>
        Promise.resolve(catalogo.find((c) => c.id === where.id) ?? null),
      ),
      findOneBy: jest.fn(({ id, tipo }: { id: number; tipo: TipoCatalogo }) =>
        Promise.resolve(
          catalogo.find((c) => c.id === id && c.tipo === tipo) ?? null,
        ),
      ),
      create: jest.fn((datos: Partial<Catalogo>) => ({ ...datos })),
    } as unknown as Repository<Catalogo>,
    {
      find: jest.fn().mockResolvedValue(habilidades),
      findOne: jest.fn(({ where }: { where: { id: number } }) =>
        Promise.resolve(
          habilidades.find((h) => h.id === where.id)
            ? { ...habilidades.find((h) => h.id === where.id) }
            : null,
        ),
      ),
      create: jest.fn((datos: Partial<Habilidad>) => ({ ...datos })),
    } as unknown as Repository<Habilidad>,
    {} as Repository<Configuracion>,
    {
      transaction: (cb: (m: unknown) => unknown) =>
        cb({
          save: (x: { id?: number }) => {
            guardados.push(x);
            return Promise.resolve({ id: 99, ...x });
          },
        }),
    } as unknown as DataSource,
    { log: auditoria } as unknown as AuditService,
  );
  return { servicio, auditoria, guardados };
}

const actor = { userId: 1, ip: '::1' };

describe('CatalogosAdminService', () => {
  it('crea una profesión dentro de un área', async () => {
    const { servicio } = preparar();
    const creada = await servicio.crearCatalogo(
      { tipo: TipoCatalogo.Profesion, nombre: 'Arquitectura', parentId: 1 },
      actor,
    );
    expect(creada.parent).toBe(construccion);
  });

  it('la profesión puede quedar sin área', async () => {
    const { servicio } = preparar();
    const creada = await servicio.crearCatalogo(
      { tipo: TipoCatalogo.Profesion, nombre: 'Arquitectura' },
      actor,
    );
    expect(creada.parent).toBeNull();
  });

  it('el área de una profesión debe ser un área', async () => {
    const { servicio } = preparar();
    await expect(
      servicio.crearCatalogo(
        { tipo: TipoCatalogo.Profesion, nombre: 'Arquitectura', parentId: 3 },
        actor,
      ),
    ).rejects.toThrow('Selecciona un área válida');
  });

  it('un municipio sigue exigiendo departamento', async () => {
    const { servicio } = preparar();
    await expect(
      servicio.crearCatalogo(
        { tipo: TipoCatalogo.Municipio, nombre: 'Huanuni' },
        actor,
      ),
    ).rejects.toThrow('Selecciona un departamento');
  });

  it('los tipos sin jerarquía no aceptan padre', async () => {
    const { servicio } = preparar();
    await expect(
      servicio.crearCatalogo(
        { tipo: TipoCatalogo.Modalidad, nombre: 'Mixta', parentId: 1 },
        actor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('una profesión no se repite aunque esté en otra área ni cambie la tilde', async () => {
    const { servicio } = preparar();
    await expect(
      servicio.crearCatalogo(
        {
          tipo: TipoCatalogo.Profesion,
          nombre: 'ingenieria civil',
          parentId: 2,
        },
        actor,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('cambia el área de una profesión y lo deja en la auditoría', async () => {
    const { servicio, auditoria } = preparar();
    const cambiada = await servicio.actualizarCatalogo(
      10,
      { parentId: 2 },
      actor,
    );
    expect(cambiada.parent).toBe(mineria);
    expect(cambiada.nombre).toBe('Ingeniería Civil');
    const registro = (auditoria.mock.calls as unknown[][])[0][0] as {
      anteriores: { parentId: number };
      nuevos: { parentId: number };
    };
    expect(registro.anteriores.parentId).toBe(1);
    expect(registro.nuevos.parentId).toBe(2);
  });

  it('una habilidad puede quedar general y no se repite sin tilde', async () => {
    const { servicio } = preparar();
    const general = await servicio.actualizarHabilidad(
      20,
      { areaId: null },
      actor,
    );
    expect(general.area).toBeNull();
    await expect(
      servicio.crearHabilidad({ nombre: 'autocad', areaId: 1 }, actor),
    ).rejects.toThrow(ConflictException);
  });

  it('el área de una habilidad debe existir', async () => {
    const { servicio } = preparar();
    await expect(
      servicio.crearHabilidad({ nombre: 'Revit', areaId: 3 }, actor),
    ).rejects.toThrow('Selecciona un área válida');
  });
});

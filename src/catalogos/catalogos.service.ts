import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TipoCatalogo } from '../common/enums';
import { NOMBRE_TIPO_CATALOGO } from '../common/etiquetas';
import { Catalogo } from './entities/catalogo.entity';
import { Habilidad } from './entities/habilidad.entity';

const mayuscula = (texto: string) => texto[0].toUpperCase() + texto.slice(1);

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Catalogo)
    private readonly catalogos: Repository<Catalogo>,
    @InjectRepository(Habilidad)
    private readonly habilidades: Repository<Habilidad>,
  ) {}

  listar(tipo: TipoCatalogo) {
    return this.catalogos.find({
      where: { tipo, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  listarHabilidades() {
    return this.habilidades.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  /** Comprueba que el id exista, sea del tipo esperado y siga activo. */
  async exigir(id: number, tipo: TipoCatalogo): Promise<Catalogo> {
    const item = await this.catalogos.findOneBy({ id, tipo });
    const { nombre, femenino } = NOMBRE_TIPO_CATALOGO[tipo];
    if (!item) {
      throw new BadRequestException(
        `${mayuscula(nombre)} ${femenino ? 'elegida' : 'elegido'} no es ${femenino ? 'válida' : 'válido'}`,
      );
    }
    if (!item.activo) {
      throw new BadRequestException(
        `${mayuscula(nombre)} «${item.nombre}» ya no está disponible. ${femenino ? 'Quítala' : 'Quítalo'} para continuar.`,
      );
    }
    return item;
  }

  /**
   * Devuelve las habilidades en el mismo orden de los ids. Si alguna se
   * desactivó, la nombra para que el usuario sepa cuál quitar.
   */
  async exigirHabilidades(ids: number[]): Promise<Habilidad[]> {
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Hay habilidades repetidas');
    }
    const encontradas = await this.habilidades.findBy({ id: In(ids) });
    const inactivas = encontradas.filter((h) => !h.activo);
    if (inactivas.length) {
      throw new BadRequestException(
        `Estas habilidades ya no están disponibles: ${inactivas
          .map((h) => h.nombre)
          .join(', ')}. Quítalas para continuar.`,
      );
    }
    if (encontradas.length !== ids.length) {
      throw new BadRequestException('Alguna habilidad no es válida');
    }
    return ids.map((id) => encontradas.find((h) => h.id === id)!);
  }
}

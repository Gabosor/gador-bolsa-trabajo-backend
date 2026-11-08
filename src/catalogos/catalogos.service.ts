import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoCatalogo } from '../common/enums';
import { Catalogo } from './entities/catalogo.entity';
import { Habilidad } from './entities/habilidad.entity';

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

  /** Comprueba que el id exista y sea del tipo esperado. */
  async exigir(id: number, tipo: TipoCatalogo): Promise<Catalogo> {
    const item = await this.catalogos.findOneBy({ id, tipo, activo: true });
    if (!item) throw new BadRequestException(`${tipo} no válido: ${id}`);
    return item;
  }
}

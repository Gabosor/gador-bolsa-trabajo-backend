import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Habilidad } from '../../catalogos/entities/habilidad.entity';
import { NivelHabilidad } from '../../common/enums';
import { Oferta } from './oferta.entity';

@Entity('oferta_habilidad')
@Unique(['oferta', 'habilidad'])
export class OfertaHabilidad {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Oferta, (o) => o.habilidades, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'oferta_id' })
  oferta: Oferta;

  @ManyToOne(() => Habilidad, { nullable: false, eager: true })
  @JoinColumn({ name: 'habilidad_id' })
  habilidad: Habilidad;

  @Column({ type: 'boolean', default: true })
  obligatoria: boolean;

  @Column({ name: 'nivel_minimo', type: 'int', default: NivelHabilidad.Basico })
  nivelMinimo: NivelHabilidad;
}

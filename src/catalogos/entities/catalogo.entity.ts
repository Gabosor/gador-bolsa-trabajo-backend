import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoCatalogo } from '../../common/enums';

/** Rubros, profesiones, tipos de contrato, modalidades y ubicaciones (RF15). */
@Entity('catalogos')
export class Catalogo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TipoCatalogo })
  tipo: TipoCatalogo;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  /** Solo municipios: apunta a su departamento. */
  @ManyToOne(() => Catalogo, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Catalogo | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}

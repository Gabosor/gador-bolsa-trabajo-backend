import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Catalogo } from './catalogo.entity';

@Entity('habilidades')
export class Habilidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 80, unique: true })
  nombre: string;

  /** Área a la que pertenece; null = habilidad general (Excel, atención al cliente…). */
  @Index('IDX_habilidades_area_id')
  @ManyToOne(() => Catalogo, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'area_id',
    foreignKeyConstraintName: 'FK_habilidades_area_id',
  })
  area: Catalogo | null;

  /** Solo lectura: se escribe asignando `area`. */
  @RelationId((h: Habilidad) => h.area)
  areaId: number | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}

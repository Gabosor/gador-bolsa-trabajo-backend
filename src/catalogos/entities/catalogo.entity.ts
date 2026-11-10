import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { TipoCatalogo } from '../../common/enums';

/** Rubros, profesiones, áreas, tipos de contrato, modalidades y ubicaciones (RF15). */
@Entity('catalogos')
export class Catalogo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TipoCatalogo })
  tipo: TipoCatalogo;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  /**
   * Municipio → su departamento (obligatorio).
   * Profesión → su área (opcional; sin área se muestra en "Otras").
   */
  @ManyToOne(() => Catalogo, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Catalogo | null;

  /** Solo lectura: se escribe asignando `parent`. */
  @RelationId((c: Catalogo) => c.parent)
  parentId: number | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoPostulacion } from '../../common/enums';
import { Oferta } from '../../ofertas/entities/oferta.entity';
import { PostulanteProfile } from '../../postulantes/entities/postulante-profile.entity';

@Entity('postulaciones')
@Unique(['oferta', 'postulante'])
export class Postulacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Oferta, { nullable: false })
  @JoinColumn({ name: 'oferta_id' })
  oferta: Oferta;

  @ManyToOne(() => PostulanteProfile, { nullable: false })
  @JoinColumn({ name: 'postulante_id' })
  postulante: PostulanteProfile;

  @Column({
    type: 'enum',
    enum: EstadoPostulacion,
    default: EstadoPostulacion.Postulado,
  })
  estado: EstadoPostulacion;

  /** Calculado una sola vez, al postular (RF10). */
  @Column({ name: 'porcentaje_match', type: 'int' })
  porcentajeMatch: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

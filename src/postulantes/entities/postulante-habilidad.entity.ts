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
import { PostulanteProfile } from './postulante-profile.entity';

@Entity('postulante_habilidad')
@Unique(['profile', 'habilidad'])
export class PostulanteHabilidad {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PostulanteProfile, (p) => p.habilidades, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: PostulanteProfile;

  @ManyToOne(() => Habilidad, { nullable: false, eager: true })
  @JoinColumn({ name: 'habilidad_id' })
  habilidad: Habilidad;

  @Column({ type: 'int' })
  nivel: NivelHabilidad;
}

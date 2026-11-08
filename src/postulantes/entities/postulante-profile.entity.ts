import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Formacion } from './formacion.entity';
import { Experiencia } from './experiencia.entity';
import { PostulanteHabilidad } from './postulante-habilidad.entity';

export interface Idioma {
  nombre: string;
  nivel: string;
}

@Entity('postulante_profiles')
export class PostulanteProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'foto_key', type: 'varchar', nullable: true })
  fotoKey: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: string | null;

  @Column({ name: 'cv_key', type: 'varchar', nullable: true })
  cvKey: string | null;

  @Column({ type: 'jsonb', default: [] })
  idiomas: Idioma[];

  @Column({ name: 'porcentaje_completitud', type: 'int', default: 0 })
  porcentajeCompletitud: number;

  @OneToMany(() => Formacion, (f) => f.profile)
  formaciones: Formacion[];

  @OneToMany(() => Experiencia, (e) => e.profile)
  experiencias: Experiencia[];

  @OneToMany(() => PostulanteHabilidad, (h) => h.profile)
  habilidades: PostulanteHabilidad[];
}

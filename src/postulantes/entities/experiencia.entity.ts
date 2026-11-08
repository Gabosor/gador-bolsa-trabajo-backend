import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostulanteProfile } from './postulante-profile.entity';

@Entity('experiencias')
export class Experiencia {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PostulanteProfile, (p) => p.experiencias, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: PostulanteProfile;

  @Column({ type: 'varchar', length: 150 })
  empresa: string;

  @Column({ type: 'varchar', length: 120 })
  cargo: string;

  @Column({ type: 'int' })
  anios: number;

  @Column({ type: 'text' })
  descripcion: string;
}

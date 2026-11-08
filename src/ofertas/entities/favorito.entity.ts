import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PostulanteProfile } from '../../postulantes/entities/postulante-profile.entity';
import { Oferta } from './oferta.entity';

@Entity('favoritos')
@Unique(['profile', 'oferta'])
export class Favorito {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PostulanteProfile, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: PostulanteProfile;

  @ManyToOne(() => Oferta, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oferta_id' })
  oferta: Oferta;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

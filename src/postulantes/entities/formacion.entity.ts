import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Catalogo } from '../../catalogos/entities/catalogo.entity';
import { PostulanteProfile } from './postulante-profile.entity';

@Entity('formaciones')
export class Formacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PostulanteProfile, (p) => p.formaciones, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: PostulanteProfile;

  /** Título obtenido, elegido del catálogo de profesiones. */
  @ManyToOne(() => Catalogo, { nullable: false, eager: true })
  @JoinColumn({ name: 'profesion_id' })
  profesion: Catalogo;

  @Column({ type: 'varchar', length: 150 })
  institucion: string;

  @Column({ name: 'anio_titulacion', type: 'int' })
  anioTitulacion: number;

  @Column({ name: 'nro_titulo_nacional', type: 'varchar', length: 50 })
  nroTituloNacional: string;
}

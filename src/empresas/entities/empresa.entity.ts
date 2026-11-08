import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Catalogo } from '../../catalogos/entities/catalogo.entity';
import { EstadoEmpresa } from '../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20, unique: true })
  nit: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 200 })
  razonSocial: string;

  @ManyToOne(() => Catalogo, { nullable: false, eager: true })
  @JoinColumn({ name: 'rubro_id' })
  rubro: Catalogo;

  @Column({ name: 'representante_legal', type: 'varchar', length: 150 })
  representanteLegal: string;

  @Column({ name: 'ci_representante', type: 'varchar', length: 20 })
  ciRepresentante: string;

  @Column({ type: 'varchar', length: 20 })
  celular: string;

  @Column({ name: 'email_corporativo', type: 'varchar', length: 150 })
  emailCorporativo: string;

  @Column({ type: 'varchar', length: 255 })
  direccion: string;

  @Column({ name: 'logo_key', type: 'varchar', nullable: true })
  logoKey: string | null;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'documento_nit_key', type: 'varchar', nullable: true })
  documentoNitKey: string | null;

  @Column({ name: 'documento_legal_key', type: 'varchar', nullable: true })
  documentoLegalKey: string | null;

  @Column({
    type: 'enum',
    enum: EstadoEmpresa,
    default: EstadoEmpresa.Pendiente,
  })
  estado: EstadoEmpresa;

  @Column({ name: 'motivo_rechazo', type: 'text', nullable: true })
  motivoRechazo: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

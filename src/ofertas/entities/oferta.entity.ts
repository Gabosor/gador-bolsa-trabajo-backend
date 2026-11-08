import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Catalogo } from '../../catalogos/entities/catalogo.entity';
import { EstadoOferta } from '../../common/enums';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { OfertaHabilidad } from './oferta-habilidad.entity';

@Entity('ofertas')
export class Oferta {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'requisitos_obligatorios', type: 'text' })
  requisitosObligatorios: string;

  @Column({ name: 'requisitos_deseables', type: 'text', nullable: true })
  requisitosDeseables: string | null;

  @ManyToMany(() => Catalogo)
  @JoinTable({
    name: 'oferta_profesion',
    joinColumn: { name: 'oferta_id' },
    inverseJoinColumn: { name: 'profesion_id' },
  })
  profesiones: Catalogo[];

  @Column({ name: 'anios_experiencia', type: 'int', default: 0 })
  aniosExperiencia: number;

  @ManyToOne(() => Catalogo, { nullable: false, eager: true })
  @JoinColumn({ name: 'tipo_contrato_id' })
  tipoContrato: Catalogo;

  @ManyToOne(() => Catalogo, { nullable: false, eager: true })
  @JoinColumn({ name: 'modalidad_id' })
  modalidad: Catalogo;

  @ManyToOne(() => Catalogo, { nullable: false, eager: true })
  @JoinColumn({ name: 'municipio_id' })
  municipio: Catalogo;

  @Column({ name: 'salario_min', type: 'int', nullable: true })
  salarioMin: number | null;

  @Column({ name: 'salario_max', type: 'int', nullable: true })
  salarioMax: number | null;

  @Column({ name: 'salario_a_tratar', type: 'boolean', default: false })
  salarioATratar: boolean;

  @Column({ type: 'text', nullable: true })
  beneficios: string | null;

  @Column({ name: 'fecha_cierre', type: 'date' })
  fechaCierre: string;

  @Column({ name: 'numero_plazas', type: 'int', default: 1 })
  numeroPlazas: number;

  @Column({ type: 'enum', enum: EstadoOferta, default: EstadoOferta.Borrador })
  estado: EstadoOferta;

  @Column({ name: 'motivo_rechazo', type: 'text', nullable: true })
  motivoRechazo: string | null;

  @Column({ name: 'total_vistas', type: 'int', default: 0 })
  totalVistas: number;

  /** Evita repetir el aviso de vencimiento en 24 h (RF12). */
  @Column({ name: 'aviso_cierre_enviado', type: 'boolean', default: false })
  avisoCierreEnviado: boolean;

  @OneToMany(() => OfertaHabilidad, (h) => h.oferta, { cascade: true })
  habilidades: OfertaHabilidad[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

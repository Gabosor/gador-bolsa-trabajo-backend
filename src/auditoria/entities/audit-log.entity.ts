import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccionAudit } from '../../common/enums';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'enum', enum: AccionAudit })
  accion: AccionAudit;

  @Column({ name: 'tabla_afectada', type: 'varchar', length: 60 })
  tablaAfectada: string;

  @Column({ name: 'registro_id', type: 'int', nullable: true })
  registroId: number | null;

  @Column({ name: 'datos_anteriores', type: 'jsonb', nullable: true })
  datosAnteriores: unknown;

  @Column({ name: 'datos_nuevos', type: 'jsonb', nullable: true })
  datosNuevos: unknown;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AccionAudit } from '../common/enums';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditEntry {
  userId: number | null;
  accion: AccionAudit;
  tabla: string;
  registroId: number | null;
  anteriores?: unknown;
  nuevos?: unknown;
  ip?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /** Pasa `manager` para que el log se guarde en la misma transacción. */
  async log(entry: AuditEntry, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(AuditLog) : this.repo;
    await repo.save(
      repo.create({
        userId: entry.userId,
        accion: entry.accion,
        tablaAfectada: entry.tabla,
        registroId: entry.registroId,
        datosAnteriores: entry.anteriores ?? null,
        datosNuevos: entry.nuevos ?? null,
        ip: entry.ip ?? null,
      }),
    );
  }
}

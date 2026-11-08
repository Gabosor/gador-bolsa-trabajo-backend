import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { AccionAudit } from '../common/enums';
import { paginado } from '../common/pagination.dto';
import { User } from '../users/entities/user.entity';
import { ListarAuditoriaDto } from './dto/auditoria.dto';
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
    @InjectRepository(User)
    private readonly users: Repository<User>,
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

  /** Visor de RF16: agrega el correo de quien hizo cada acción. */
  async listar(dto: ListarAuditoriaDto) {
    const [registros, total] = await this.repo.findAndCount({
      where: {
        ...(dto.accion && { accion: dto.accion }),
        ...(dto.tabla && { tablaAfectada: dto.tabla }),
      },
      order: { id: 'DESC' },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });
    const ids = registros.flatMap((r) => (r.userId ? [r.userId] : []));
    const usuarios = await this.users.findBy({ id: In(ids) });
    const data = registros.map((r) => ({
      ...r,
      usuario: usuarios.find((u) => u.id === r.userId)?.email ?? null,
    }));
    return paginado(data, total, dto);
  }
}

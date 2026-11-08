import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Roles } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { META_ROLES } from '../decorators/auth.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<Roles[]>(META_ROLES, context.getHandler());
    if (!roles || roles.length === 0) return true;
    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user: User }>();
    if (roles.includes(user.role.nombre as Roles)) return true;
    throw new ForbiddenException('No tienes permiso para esta acción');
  }
}

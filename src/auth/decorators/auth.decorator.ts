import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Roles } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { UserRoleGuard } from '../guards/user-role.guard';

export const META_ROLES = 'roles';

/** Exige JWT válido y, si se indican, uno de los roles. */
export function Auth(...roles: Roles[]) {
  return applyDecorators(
    SetMetadata(META_ROLES, roles),
    UseGuards(AuthGuard('jwt'), UserRoleGuard),
  );
}

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User =>
    ctx.switchToHttp().getRequest<Request & { user: User }>().user,
);

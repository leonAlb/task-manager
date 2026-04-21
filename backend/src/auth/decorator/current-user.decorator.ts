import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser, JwtPayload } from '../guard/auth.guard';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) return null;
    return data ? request.user[data] : request.user;
  },
);

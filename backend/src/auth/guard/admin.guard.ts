import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RequestWithUser, JwtPayload } from './auth.guard';
import { extractTokenFromHeader } from '../utils/extract-token';
import { ConfigService } from '@nestjs/config/dist/config.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.email !== this.configService.get('ADMIN_EMAIL')) {
      throw new ForbiddenException('Admin only');
    }

    request.user = payload;
    return true;
  }
}

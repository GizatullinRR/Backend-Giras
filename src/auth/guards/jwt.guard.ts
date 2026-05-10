import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Токен не предоставлен');
    }

    try {
      const user = this.authService.validateToken(token);
      request['user'] = user;
      return true;
    } catch {
      throw new UnauthorizedException('Невалидный токен');
    }
  }

  private extractToken(request: Request): string | null {
    const cookieToken = request.cookies?.accessToken;
    if (typeof cookieToken === 'string' && cookieToken.length > 0) {
      return cookieToken;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    const [type, t] = authHeader.split(' ');
    return type === 'Bearer' ? t : null;
  }
}

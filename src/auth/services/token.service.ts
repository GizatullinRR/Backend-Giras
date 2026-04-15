import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { User } from '../entities/user.entity';
import { UserRole } from '../user-role.enum';

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: StringValue;
  private readonly refreshExpiresIn: StringValue;
  private readonly refreshExpiresDays: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret = configService.get('JWT_ACCESS_SECRET', 'access_secret');
    this.refreshSecret = configService.get('JWT_REFRESH_SECRET', 'refresh_secret');
    this.accessExpiresIn = configService.get('JWT_ACCESS_EXPIRES_IN', '15m') as StringValue;
    this.refreshExpiresIn = configService.get('JWT_REFRESH_EXPIRES_IN', '30d') as StringValue;
    this.refreshExpiresDays = configService.get<number>('JWT_REFRESH_EXPIRES_DAYS', 30);
  }

  createTokenPair(user: User): { accessToken: string; refreshToken: string; expiresAt: Date } {
    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { secret: this.accessSecret, expiresIn: this.accessExpiresIn },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpiresDays);

    return { accessToken, refreshToken, expiresAt };
  }

  verifyAccess(token: string): { id: string; role: UserRole } {
    try {
      const payload = this.jwtService.verify<{ sub: string; role: UserRole }>(token, {
        secret: this.accessSecret,
      });
      return { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException('Невалидный токен');
    }
  }
}

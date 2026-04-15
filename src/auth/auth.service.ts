import { Injectable, Logger, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './repositories/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { TokenService } from './services/token.service';
import { UserRole } from './user-role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async getMe(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepo.getByIdOrFail(id);
    const { password, ...result } = user;
    return result;
  }

  validateToken(accessToken: string): { id: string; role: UserRole } {
    return this.tokenService.verifyAccess(accessToken);
  }

  async register(dto: RegisterDto): Promise<{ accessToken: string; refreshToken: string }> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: UserRole.USER,
    });

    const { accessToken, refreshToken, expiresAt } = this.tokenService.createTokenPair(user);
    await this.refreshTokenRepo.saveToken(user, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const { accessToken, refreshToken, expiresAt } = this.tokenService.createTokenPair(user);
    await this.refreshTokenRepo.saveToken(user, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenEntity = await this.refreshTokenRepo.findByToken(token);

    if (!tokenEntity) {
      throw new UnauthorizedException('Refresh token не найден');
    }

    if (tokenEntity.expiresAt < new Date()) {
      await this.refreshTokenRepo.remove(tokenEntity);
      throw new UnauthorizedException('Refresh token истёк');
    }

    await this.refreshTokenRepo.remove(tokenEntity);

    const { accessToken, refreshToken, expiresAt } = this.tokenService.createTokenPair(tokenEntity.user);
    await this.refreshTokenRepo.saveToken(tokenEntity.user, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  async logout(token: string): Promise<{ message: string }> {
    const tokenEntity = await this.refreshTokenRepo.findByToken(token);
    if (tokenEntity) {
      await this.refreshTokenRepo.remove(tokenEntity);
    }
    return { message: 'Выход выполнен успешно' };
  }

  async cleanExpiredTokens(): Promise<void> {
    const deleted = await this.refreshTokenRepo.deleteExpired();
    this.logger.log(`Удалено истёкших токенов: ${deleted}`);
  }
}

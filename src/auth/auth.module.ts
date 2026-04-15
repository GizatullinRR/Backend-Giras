import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';

import { UserRepository } from './repositories/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { TokenService } from './services/token.service';
import { AdminSeeder } from './services/admin-seeder.service';
import { TokenCleanupScheduler } from './schedulers/token-cleanup.scheduler';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    UserRepository,
    RefreshTokenRepository,
    TokenService,
    AdminSeeder,
    TokenCleanupScheduler,
    AuthService,
    JwtGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtGuard, RolesGuard],
})
export class AuthModule {}

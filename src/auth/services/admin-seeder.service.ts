import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { UserRole } from '../user-role.enum';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    const name = this.configService.get<string>('ADMIN_NAME', 'Admin');

    if (!email || !password) {
      this.logger.warn('ADMIN_EMAIL или ADMIN_PASSWORD не заданы — админ не создан');
      return;
    }

    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      this.logger.log('Админ уже существует');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepo.create({ email, password: hashedPassword, name, role: UserRole.ADMIN });
    this.logger.log('Админ создан успешно');
  }
}

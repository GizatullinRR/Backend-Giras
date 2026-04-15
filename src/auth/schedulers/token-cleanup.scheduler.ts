import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth.service';

@Injectable()
export class TokenCleanupScheduler {
  constructor(private readonly authService: AuthService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredTokens(): Promise<void> {
    await this.authService.cleanExpiredTokens();
  }
}

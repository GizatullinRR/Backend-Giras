import { Module } from '@nestjs/common';
import { WorkwearController } from './workwear.controller';
import { WorkwearService } from './workwear.service';
import { WorkwearRepository } from './workwear.repository';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, StorageModule, AuthModule],
  controllers: [WorkwearController],
  providers: [WorkwearRepository, WorkwearService],
})
export class WorkwearModule {}

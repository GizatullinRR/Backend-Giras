import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../auth/entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Workwear } from '../workwear/workwear.entity';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST', 'localhost'),
        port: configService.get<number>('POSTGRES_PORT', 5433),
        username: configService.get<string>('POSTGRES_USER', 'postgres'),
        password: configService.get<string>('POSTGRES_PASSWORD', 'admin'),
        database: configService.get<string>('POSTGRES_DB', 'giras'),
        synchronize: configService.get<boolean>('POSTGRES_SYNCHRONIZE', true),
        logging: configService.get<boolean>('POSTGRES_LOGGING', false),
        entities: [User, RefreshToken, Workwear],
      });

      try {
        const connection = await dataSource.initialize();
        console.log('Postgres connection established');
        return connection;
      } catch (error) {
        console.error('Postgres connection failed:', error.message);
        throw error;
      }
    },
  },
];

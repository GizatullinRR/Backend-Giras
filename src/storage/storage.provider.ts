import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

export const minioProviders = [
  {
    provide: 'MINIO_CLIENT',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const minioClient = new Minio.Client({
        endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
        port: parseInt(configService.get('MINIO_PORT', '9000'), 10),
        useSSL: configService.get('MINIO_USE_SSL', 'false') === 'true',
        accessKey: configService.get<string>('MINIO_ROOT_USER', 'minioadmin'),
        secretKey: configService.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin123'),
      });

      try {
        await minioClient.listBuckets();
        console.log('MinIO connection established');
        return minioClient;
      } catch (error) {
        console.error('MinIO connection failed:', error.message);
        throw error;
      }
    },
  },
];

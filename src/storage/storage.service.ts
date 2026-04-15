import { Inject, Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

export type FilePayload = {
  buffer: Buffer | { data: number[] };
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = 'workwear';
  private readonly endpoint: string;
  private readonly port: string;

  constructor(
    @Inject('MINIO_CLIENT') private readonly minioClient: Minio.Client,
    private readonly configService: ConfigService,
  ) {
    this.endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    this.port = this.configService.get<string>('MINIO_PORT', '9000');
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket);
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(this.bucket, JSON.stringify(policy));
        this.logger.log(`Бакет "${this.bucket}" создан`);
      }
    } catch (error) {
      this.logger.error('Ошибка при создании бакета', error);
      throw error;
    }
  }

  async uploadFile(file: FilePayload): Promise<string> {
    try {
      const ext = file.originalname.split('.').pop();
      const filename = `${uuidv4()}.${ext}`;

      const buffer = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from((file.buffer as { data: number[] }).data);

      await this.minioClient.putObject(this.bucket, filename, buffer, file.size, {
        'Content-Type': file.mimetype,
      });

      return `http://${this.endpoint}:${this.port}/${this.bucket}/${filename}`;
    } catch (error) {
      this.logger.error('Ошибка при загрузке файла', error);
      throw new InternalServerErrorException('Ошибка при загрузке файла');
    }
  }

  async uploadFiles(files: FilePayload[]): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadFile(file)));
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const filename = url.split('/').pop();
      if (filename) {
        await this.minioClient.removeObject(this.bucket, filename);
      }
    } catch (error) {
      this.logger.error('Ошибка при удалении файла', error);
      throw new InternalServerErrorException('Ошибка при удалении файла');
    }
  }

  async copyFiles(urls: string[]): Promise<string[]> {
    const newUrls: string[] = [];

    for (const url of urls) {
      try {
        const filename = url.split('/').pop();
        if (!filename) continue;

        const ext = filename.split('.').pop();
        const newFilename = `${uuidv4()}.${ext}`;

        await this.minioClient.copyObject(
          this.bucket,
          newFilename,
          `/${this.bucket}/${filename}`,
        );

        newUrls.push(`http://${this.endpoint}:${this.port}/${this.bucket}/${newFilename}`);
      } catch (error) {
        this.logger.error('Ошибка при копировании файла', error);
        throw new InternalServerErrorException('Ошибка при копировании файла');
      }
    }

    return newUrls;
  }
}

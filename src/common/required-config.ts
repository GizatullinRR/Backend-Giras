import { ConfigService } from '@nestjs/config';

export function requireEnvString(configService: ConfigService, key: string): string {
  const value = configService.get<string>(key)?.trim();
  if (!value) {
    throw new Error(`Переменная окружения ${key} обязательна и не должна быть пустой`);
  }
  return value;
}

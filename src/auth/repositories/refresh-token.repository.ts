import { Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class RefreshTokenRepository {
  private readonly repo: Repository<RefreshToken>;

  constructor(@Inject('DATA_SOURCE') dataSource: DataSource) {
    this.repo = dataSource.getRepository(RefreshToken);
  }

  findByToken(token: string): Promise<RefreshToken | null> {
    return this.repo.findOne({ where: { token }, relations: ['user'] });
  }

  async saveToken(user: User, token: string, expiresAt: Date): Promise<RefreshToken> {
    const refreshToken = this.repo.create({ token, expiresAt, user });
    return this.repo.save(refreshToken);
  }

  async remove(token: RefreshToken): Promise<void> {
    await this.repo.remove(token);
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
    return result.affected ?? 0;
  }
}

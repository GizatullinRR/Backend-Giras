import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../user-role.enum';

@Injectable()
export class UserRepository {
  private readonly repo: Repository<User>;

  constructor(@Inject('DATA_SOURCE') dataSource: DataSource) {
    this.repo = dataSource.getRepository(User);
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async getByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  create(data: { email: string; password: string; name: string; role: UserRole }): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }
}

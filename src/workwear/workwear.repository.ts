import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Workwear } from './workwear.entity';
import { CreateWorkwearDto } from './dto/create-workwear.dto';
import { FilterWorkwearDto } from './dto/filter-workwear.dto';

@Injectable()
export class WorkwearRepository {
  private readonly repo: Repository<Workwear>;

  constructor(@Inject('DATA_SOURCE') private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(Workwear);
  }

  findFiltered(filters: FilterWorkwearDto): Promise<Workwear[]> {
    const qb = this.repo.createQueryBuilder('w').orderBy('w.order', 'ASC');

    if (filters.category) {
      qb.andWhere('w.category = :category', { category: filters.category });
    }

    if (filters.season) {
      qb.andWhere('w.season = :season', { season: filters.season });
    }

    if (filters.gender) {
      qb.andWhere('w.gender = :gender', { gender: filters.gender });
    }

    if (filters.set) {
      qb.andWhere('w.set = :set', { set: filters.set });
    }

    if (typeof filters.isCertified === 'boolean') {
      qb.andWhere('w.isCertified = :isCertified', {
        isCertified: filters.isCertified,
      });
    }

    if (typeof filters.priceFrom === 'number') {
      qb.andWhere('w.price >= :priceFrom', { priceFrom: filters.priceFrom });
    }

    if (typeof filters.priceTo === 'number') {
      qb.andWhere('w.price <= :priceTo', { priceTo: filters.priceTo });
    }

    return qb.getMany();
  }

  async findById(id: string): Promise<Workwear> {
    const workwear = await this.repo.findOne({ where: { id } });
    if (!workwear) {
      throw new NotFoundException(`Спецодежда с id ${id} не найдена`);
    }
    return workwear;
  }

  async create(dto: CreateWorkwearDto, imageKeys: string[]): Promise<Workwear> {
    const maxOrder = (await this.repo.maximum('order')) ?? -1;
    const entity = this.repo.create({
      ...dto,
      images: imageKeys,
      order: maxOrder + 1,
    });
    return this.repo.save(entity);
  }

  async save(entity: Workwear): Promise<Workwear> {
    return this.repo.save(entity);
  }

  async removeEntity(entity: Workwear): Promise<void> {
    await this.repo.remove(entity);
  }

  async getImages(id: string): Promise<string[]> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity?.images ?? [];
  }

  async reorder(items: { id: string; order: number }[]): Promise<void> {
    await this.repo.manager.transaction(async (manager) => {
      for (const item of items) {
        await manager.update(Workwear, item.id, { order: item.order });
      }
    });
  }
}

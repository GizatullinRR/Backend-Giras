import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Workwear } from './workwear.entity';
import { CreateWorkwearDto } from './dto/create-workwear.dto';

@Injectable()
export class WorkwearRepository {
  private readonly repo: Repository<Workwear>;

  constructor(@Inject('DATA_SOURCE') private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(Workwear);
  }

  findAll(): Promise<Workwear[]> {
    return this.repo.find({ order: { order: 'ASC' } });
  }

  findAllSearch(q: string): Promise<Workwear[]> {
    const term = `%${q.trim()}%`;
    return this.repo
      .createQueryBuilder('w')
      .where(
        `(
          w.name ILIKE :term OR
          COALESCE(w.description, '') ILIKE :term OR
          w.sku ILIKE :term OR
          w.color ILIKE :term OR
          w.material ILIKE :term OR
          CAST(w.season AS text) ILIKE :term OR
          CAST(w.set AS text) ILIKE :term OR
          CAST(w.size AS text) ILIKE :term OR
          CAST(w.category AS text) ILIKE :term
        )`,
        { term },
      )
      .orderBy('w.order', 'ASC')
      .getMany();
  }

  async findById(id: string): Promise<Workwear> {
    const workwear = await this.repo.findOne({ where: { id } });
    if (!workwear) {
      throw new NotFoundException(`Спецодежда с id ${id} не найдена`);
    }
    return workwear;
  }

  async create(dto: CreateWorkwearDto, imageUrls: string[]): Promise<Workwear> {
    const maxOrder = (await this.repo.maximum('order')) ?? -1;
    const entity = this.repo.create({ ...dto, images: imageUrls, order: maxOrder + 1 });
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

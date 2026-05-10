import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { WorkwearRepository } from './workwear.repository';
import { Workwear } from './workwear.entity';
import { CreateWorkwearDto } from './dto/create-workwear.dto';
import { UpdateWorkwearDto } from './dto/update-workwear.dto';
import { ListWorkwearSearchDto } from './dto/list-workwear-search.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class WorkwearService {
  private readonly logger = new Logger(WorkwearService.name);

  constructor(
    private readonly repo: WorkwearRepository,
    private readonly storage: StorageService,
  ) {}

  findAll(query: ListWorkwearSearchDto): Promise<Workwear[]> {
    const q = query.q?.trim();
    if (!q) {
      return this.repo.findAll();
    }
    return this.repo.findAllSearch(q);
  }

  findById(id: string): Promise<Workwear> {
    return this.repo.findById(id);
  }

  getImages(id: string): Promise<string[]> {
    return this.repo.getImages(id);
  }

  async create(dto: CreateWorkwearDto, imageUrls: string[]): Promise<Workwear> {
    try {
      return await this.repo.create(dto, imageUrls);
    } catch (error) {
      this.logger.error('Ошибка при создании спецодежды', error);
      throw new InternalServerErrorException('Ошибка при создании спецодежды');
    }
  }

  async update(id: string, dto: UpdateWorkwearDto, imageUrls: string[]): Promise<Workwear> {
    const workwear = await this.repo.findById(id);
    const removedImages = (workwear.images ?? []).filter((url) => !imageUrls.includes(url));
    try {
      Object.assign(workwear, dto);
      workwear.images = imageUrls;
      const saved = await this.repo.save(workwear);
      for (const url of removedImages) {
        try {
          await this.storage.deleteFile(url);
        } catch (e) {
          this.logger.warn(`Не удалось удалить файл из хранилища: ${url}`, e);
        }
      }
      return saved;
    } catch (error) {
      this.logger.error('Ошибка при обновлении спецодежды', error);
      throw new InternalServerErrorException('Ошибка при обновлении спецодежды');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const workwear = await this.repo.findById(id);
    const urls = workwear.images ?? [];
    await this.repo.removeEntity(workwear);
    await Promise.allSettled(urls.map((url) => this.storage.deleteFile(url)));
    return { message: `Спецодежда с id ${id} удалена` };
  }

  async copy(id: string, imageUrls: string[]): Promise<Workwear> {
    const { id: _, createdAt, updatedAt, images: _images, order: _order, ...data } =
      await this.repo.findById(id);
    return this.repo.create(
      {
        ...(data as CreateWorkwearDto),
        isCertified: data.isCertified === true,
      },
      imageUrls,
    );
  }

  async reorder(items: { id: string; order: number }[]): Promise<{ success: true }> {
    await this.repo.reorder(items);
    return { success: true };
  }
}

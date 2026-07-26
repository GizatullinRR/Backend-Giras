import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { WorkwearRepository } from './workwear.repository';
import { Workwear } from './workwear.entity';
import { CreateWorkwearDto } from './dto/create-workwear.dto';
import { UpdateWorkwearDto } from './dto/update-workwear.dto';
import { WorkwearResponse } from './dto/workwear-response';
import { StorageService } from '../storage/storage.service';
import { FilterWorkwearDto } from './dto/filter-workwear.dto';

@Injectable()
export class WorkwearService {
  private readonly logger = new Logger(WorkwearService.name);

  constructor(
    private readonly repo: WorkwearRepository,
    private readonly storage: StorageService,
  ) {}

  async findAll(filters: FilterWorkwearDto): Promise<WorkwearResponse[]> {
    const items = await this.repo.findFiltered(filters);
    return items.map((item) => this.toResponse(item));
  }

  async findById(id: string): Promise<WorkwearResponse> {
    const workwear = await this.repo.findById(id);
    return this.toResponse(workwear);
  }

  getImages(id: string): Promise<string[]> {
    return this.repo.getImages(id);
  }

  async create(
    dto: CreateWorkwearDto,
    imageKeys: string[],
  ): Promise<WorkwearResponse> {
    try {
      const createdItem = await this.repo.create(dto, imageKeys);
      return this.toResponse(createdItem);
    } catch (error) {
      this.logger.error('Ошибка при создании спецодежды', error);
      throw new InternalServerErrorException('Ошибка при создании спецодежды');
    }
  }

  async update(
    id: string,
    dto: UpdateWorkwearDto,
    imageKeys?: string[],
  ): Promise<WorkwearResponse> {
    const workwear = await this.repo.findById(id);
    Object.assign(workwear, dto);

    if (imageKeys !== undefined) {
      const removed = (workwear.images ?? []).filter(
        (key) => !imageKeys.includes(key),
      );
      workwear.images = imageKeys;
      const saved = await this.repo.save(workwear);
      for (const key of removed) {
        try {
          await this.storage.deleteFile(key);
        } catch (e) {
          this.logger.warn(`Не удалось удалить файл: ${key}`, e);
        }
      }
      return this.toResponse(saved);
    }

    return this.toResponse(await this.repo.save(workwear));
  }

  async remove(id: string): Promise<{ message: string }> {
    const workwear = await this.repo.findById(id);
    const imageKeys = workwear.images ?? [];
    await this.repo.removeEntity(workwear);
    await Promise.allSettled(
      imageKeys.map((key) => this.storage.deleteFile(key)),
    );
    return { message: `Спецодежда с id ${id} удалена` };
  }

  async copy(id: string, imageKeys: string[]): Promise<WorkwearResponse> {
    const {
      id: _,
      createdAt,
      updatedAt,
      images: _images,
      order: _order,
      ...data
    } = await this.repo.findById(id);
    const created = await this.repo.create(
      {
        ...(data as CreateWorkwearDto),
        isCertified: data.isCertified === true,
      },
      imageKeys,
    );

    return this.toResponse(created);
  }

  async reorder(
    items: { id: string; order: number }[],
  ): Promise<{ success: true }> {
    await this.repo.reorder(items);
    return { success: true };
  }

  private toResponse(workwear: Workwear): WorkwearResponse {
    const imageKeys = workwear.images ?? [];
    return {
      ...workwear,
      imageKeys,
      images: imageKeys.map((key) => this.storage.toPublicUrl(key)),
    };
  }
}

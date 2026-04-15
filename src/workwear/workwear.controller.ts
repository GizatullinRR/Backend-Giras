import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateWorkwearDto } from './dto/create-workwear.dto';
import { UpdateWorkwearDto } from './dto/update-workwear.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import { WorkwearService } from './workwear.service';
import { StorageService } from '../storage/storage.service';
import { ListWorkwearSearchDto } from './dto/list-workwear-search.dto';

@Controller('workwear')
export class WorkwearController {
  constructor(
    private readonly workwearService: WorkwearService,
    private readonly storageService: StorageService,
  ) {}

  @Get('get-all')
  async getAll(@Query() query: ListWorkwearSearchDto) {
    return this.workwearService.findAll(query);
  }

  @Get('get-one/:id')
  async getOne(@Param('id') id: string) {
    return this.workwearService.findById(id);
  }

  @Post('create-one')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  async createOne(
    @Body() dto: CreateWorkwearDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    let imageUrls: string[] = [];

    if (files?.length > 0) {
      const serializedFiles = files.map((file) => ({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      }));

      imageUrls = await this.storageService.uploadFiles(serializedFiles);
    }

    try {
      return await this.workwearService.create(dto, imageUrls);
    } catch (error) {
      if (imageUrls.length > 0) {
        await Promise.allSettled(imageUrls.map((url) => this.storageService.deleteFile(url)));
      }
      throw error;
    }
  }

  @Post('copy-one/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async copyOne(@Param('id') id: string) {
    const originalImages = await this.workwearService.getImages(id);

    const imageUrls =
      originalImages.length > 0 ? await this.storageService.copyFiles(originalImages) : [];

    try {
      return await this.workwearService.copy(id, imageUrls);
    } catch (error) {
      if (imageUrls.length > 0) {
        await Promise.allSettled(imageUrls.map((url) => this.storageService.deleteFile(url)));
      }
      throw error;
    }
  }

  @Put('update-one/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  async updateOne(
    @Param('id') id: string,
    @Body() dto: UpdateWorkwearDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const { existingImages = [], ...restDto } = dto;
    let newImageUrls: string[] = [];

    if (files?.length > 0) {
      const serializedFiles = files.map((file) => ({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      }));

      newImageUrls = await this.storageService.uploadFiles(serializedFiles);
    }

    const imageUrls = [...existingImages, ...newImageUrls];

    try {
      return await this.workwearService.update(id, restDto, imageUrls);
    } catch (error) {
      if (newImageUrls.length > 0) {
        await Promise.allSettled(newImageUrls.map((url) => this.storageService.deleteFile(url)));
      }
      throw error;
    }
  }

  @Patch('reorder')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async reorder(@Body() items: { id: string; order: number }[]) {
    return this.workwearService.reorder(items);
  }

  @Delete('delete-one/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteOne(@Param('id') id: string) {
    return this.workwearService.remove(id);
  }
}

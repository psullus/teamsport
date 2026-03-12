import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CarouselImage } from '@teamsport/shared';
import { OrganisationEntity } from './entities/organisation.entity';
import { CarouselImageEntity } from './entities/carousel-image.entity';
import { S3Service } from './s3.service';

@Injectable()
export class HomeContentService {
  constructor(
    @InjectRepository(OrganisationEntity)
    private orgRepo: Repository<OrganisationEntity>,
    @InjectRepository(CarouselImageEntity)
    private carouselRepo: Repository<CarouselImageEntity>,
    private s3: S3Service,
  ) {}

  async getHomeContent(orgId: string): Promise<{ message: string | null; images: CarouselImage[] }> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organisation not found');

    const images = await this.carouselRepo.find({
      where: { organisation: { id: orgId } },
      order: { sortOrder: 'ASC' },
    });

    return {
      message: org.homeMessage,
      images: images.map((img) => ({
        id: img.id,
        url: this.s3.getPublicUrl(img.imagePath),
        sortOrder: img.sortOrder,
      })),
    };
  }

  async updateMessage(orgId: string, message: string | null): Promise<{ success: boolean }> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organisation not found');
    org.homeMessage = message;
    await this.orgRepo.save(org);
    return { success: true };
  }

  async addImage(orgId: string, file: Express.Multer.File): Promise<CarouselImage> {
    const key = await this.s3.uploadCarouselImage(file);
    const maxSort = await this.carouselRepo
      .createQueryBuilder('img')
      .select('MAX(img.sortOrder)', 'max')
      .where('img.organisationId = :orgId', { orgId })
      .getRawOne();
    const sortOrder = (maxSort?.max ?? -1) + 1;

    const entity = this.carouselRepo.create({
      imagePath: key,
      sortOrder,
      organisation: { id: orgId },
    });
    const saved = await this.carouselRepo.save(entity);
    return {
      id: saved.id,
      url: this.s3.getPublicUrl(saved.imagePath),
      sortOrder: saved.sortOrder,
    };
  }

  async deleteImage(imageId: string): Promise<void> {
    const image = await this.carouselRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException('Image not found');
    await this.s3.deleteCarouselImage(image.imagePath);
    await this.carouselRepo.remove(image);
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { HomeContentService } from './home-content.service';
import { OrganisationEntity } from './entities/organisation.entity';
import { CarouselImageEntity } from './entities/carousel-image.entity';
import { S3Service } from './s3.service';

const mockOrg = {
  id: 'org-1',
  name: 'Test Org',
  homeMessage: 'Welcome!',
};

const mockImage = {
  id: 'img-1',
  imagePath: 'carousel/abc.jpg',
  sortOrder: 0,
  organisation: { id: 'org-1' },
};

const mockOrgRepo = {
  findOne: vi.fn().mockResolvedValue(mockOrg),
  save: vi.fn((entity) => Promise.resolve({ ...mockOrg, ...entity })),
};

const mockCarouselRepo = {
  find: vi.fn().mockResolvedValue([mockImage]),
  findOne: vi.fn().mockResolvedValue(mockImage),
  create: vi.fn((data) => ({ ...mockImage, ...data })),
  save: vi.fn((entity) => Promise.resolve({ ...mockImage, ...entity })),
  remove: vi.fn().mockResolvedValue(undefined),
  createQueryBuilder: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    getRawOne: vi.fn().mockResolvedValue({ max: 0 }),
  }),
};

const mockS3 = {
  getPublicUrl: vi.fn((key: string) => `https://bucket.s3.amazonaws.com/${key}`),
  uploadCarouselImage: vi.fn().mockResolvedValue('carousel/new.jpg'),
  deleteCarouselImage: vi.fn().mockResolvedValue(undefined),
};

describe('HomeContentService', () => {
  let service: HomeContentService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        HomeContentService,
        { provide: getRepositoryToken(OrganisationEntity), useValue: mockOrgRepo },
        { provide: getRepositoryToken(CarouselImageEntity), useValue: mockCarouselRepo },
        { provide: S3Service, useValue: mockS3 },
      ],
    }).compile();

    service = module.get(HomeContentService);
  });

  describe('getHomeContent', () => {
    it('should return message and images for the organisation', async () => {
      const result = await service.getHomeContent('org-1');

      expect(result.message).toBe('Welcome!');
      expect(result.images).toHaveLength(1);
      expect(result.images[0].id).toBe('img-1');
      expect(result.images[0].url).toContain('carousel/abc.jpg');
      expect(mockOrgRepo.findOne).toHaveBeenCalledWith({ where: { id: 'org-1' } });
    });

    it('should throw NotFoundException when org not found', async () => {
      mockOrgRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.getHomeContent('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMessage', () => {
    it('should update the home message', async () => {
      const result = await service.updateMessage('org-1', 'New message');

      expect(result.success).toBe(true);
      expect(mockOrgRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ homeMessage: 'New message' }),
      );
    });

    it('should throw NotFoundException when org not found', async () => {
      mockOrgRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.updateMessage('bad-id', 'msg')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addImage', () => {
    it('should upload image and create entity', async () => {
      const file = { originalname: 'photo.jpg', buffer: Buffer.from(''), mimetype: 'image/jpeg' } as Express.Multer.File;
      const result = await service.addImage('org-1', file);

      expect(mockS3.uploadCarouselImage).toHaveBeenCalledWith(file);
      expect(mockCarouselRepo.create).toHaveBeenCalled();
      expect(mockCarouselRepo.save).toHaveBeenCalled();
      expect(result.url).toContain('carousel/');
    });
  });

  describe('deleteImage', () => {
    it('should delete from S3 and remove entity', async () => {
      await service.deleteImage('img-1');

      expect(mockCarouselRepo.findOne).toHaveBeenCalledWith({ where: { id: 'img-1' } });
      expect(mockS3.deleteCarouselImage).toHaveBeenCalledWith('carousel/abc.jpg');
      expect(mockCarouselRepo.remove).toHaveBeenCalledWith(mockImage);
    });

    it('should throw NotFoundException when image not found', async () => {
      mockCarouselRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.deleteImage('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});

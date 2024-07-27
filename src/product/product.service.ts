import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { EntityManager, Repository } from 'typeorm';
import * as fs from 'fs';
import { promisify } from 'util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly entityManager: EntityManager,
  ) {}
  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async create(product: CreateProductDto, filename: string): Promise<Product> {
    try {
      product.fileName = filename;
      const savedProduct = await this.productRepository.save(product);
      const savedToCache = await this.cacheManager.set(
        savedProduct.id.toString(),
        savedProduct,
      );

      return savedProduct;
    } catch (error) {
      return error;
    }
  }

  async findImage(id: number) {
    let product: Product;
    product = await this.cacheManager.get(id.toString());

    if (!product) {
      product = await this.productRepository.findOneBy({ id });
    }

    if (!product) throw new NotFoundException('the ID that provided not found');

    const fileName = product.fileName;
    if (!fileName)
      throw new NotFoundException('this ID does not have an image');
    try {
      const readFile = promisify(fs.readFile);
      const image = readFile(`files/${fileName}`);
      return image;
    } catch (error) {
      throw new NotFoundException('no image found');
    }
  }

  async remove(id: number): Promise<string> {
    await this.entityManager.transaction(async (entityManager) => {
      let product: Product;
      product = await this.cacheManager.get(id.toString());
      if (!product) product = await this.productRepository.findOneBy({ id });
      if (!product)
        throw new NotFoundException('the ID that provided not found');
      await this.productRepository.delete(id);
      const deleteFile = promisify(fs.rm);
      deleteFile(`files/${product.fileName}`);
    });
    return 'deleted';
  }
}

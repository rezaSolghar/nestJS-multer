import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { promisify } from 'util';
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async create(product: CreateProductDto, filename: string): Promise<Product> {
    product.fileName = filename;
    return this.productRepository.save(product);
  }

  async findImage(id: number) {
    const product = await this.productRepository.findOneBy({ id });
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
    try {
      const product = await this.productRepository.findOneBy({ id });
      if (!product)
        throw new NotFoundException('the ID that provided not found');
      const deletedProduct = await this.productRepository.delete(id);
      const deleteFile = promisify(fs.rm);
      deleteFile(`files/${product.fileName}`);
      return 'deleted';
    } catch (error) {
      return error;
    }
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  Inject,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response as ExpressResponse, Response } from 'express';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100000000 }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() product: CreateProductDto,
  ) {
    if (!file) {
      throw new Error('File upload failed, no file found');
    }
    const fileName: string = file.filename;
    const newProduct = await this.productService.create(product, fileName);

    return { product: newProduct.name, file: file.filename };
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  async findImage(@Res() res: Response, @Param('id') id: number) {
    res.set('Content-Type', 'image/jpeg');
    res.send(await this.productService.findImage(id));
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<string> {
    return await this.productService.remove(id);
  }
}

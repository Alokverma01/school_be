import { Module } from '@nestjs/common';
import { ProductCategoriesController } from './product_categories.controller';
import { ProductCategoryService } from './product_categories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from './product_categories.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ProductCategory])],
  controllers: [ProductCategoriesController],
  providers: [ProductCategoryService]
})

export class ProductCategoriesModule {}

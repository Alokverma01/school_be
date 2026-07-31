import { Module } from '@nestjs/common';
import { AssetCategoriesController } from './asset_categories.controller';
import { AssetCategoryService } from './asset_categories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetCategory } from './asset_categories.entity';

@Module({
  imports:[TypeOrmModule.forFeature([AssetCategory])],
  controllers: [AssetCategoriesController],
  providers: [AssetCategoryService]
})
export class AssetCategoriesModule {}

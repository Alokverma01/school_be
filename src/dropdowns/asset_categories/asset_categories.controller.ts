import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { AssetCategoryService } from './asset_categories.service';

@Controller('asset-categories')
export class AssetCategoriesController {
  constructor(private readonly service: AssetCategoryService) {}

  @Post('add')
  create(@Body('category_name') category_name: string) {
    return this.service.create(category_name);
  }

  @Get('get-all')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? parseInt(page) : undefined;
    const l = limit ? parseInt(limit) : undefined;
    return this.service.findAll(p, l);
  }

  @Get('get-by-id')
  findOne(@Query('id') id: number) {
    return this.service.findOne(id);
  }

  @Put('update')
  update(@Query('id') id: number, @Body('category_name') category_name: string) {
    return this.service.update(id, category_name);
  }

  @Delete('delete')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}

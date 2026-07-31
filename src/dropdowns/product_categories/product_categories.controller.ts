import { Controller, Post, Body, Get, Query, Param, Put, Delete } from '@nestjs/common';
import { ProductCategoryService } from './product_categories.service';

@Controller('product-categories')
export class ProductCategoriesController {
    constructor(private readonly productCategoryService: ProductCategoryService) { }

    @Post('add')
    create(@Body('category_name') category_name: string) {
        return this.productCategoryService.create(category_name);
    }

    @Get('get-all')
    findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
        const p = page ? parseInt(page) : undefined;
        const l = limit ? parseInt(limit) : undefined;
        return this.productCategoryService.findAll(p, l);
    }

    @Get('get-by-id')
    findOne(@Query('id') id: number) {
        return this.productCategoryService.findOne(id);
    }

    @Put('update')
    update(@Query('id') id: number, @Body('category_name') category_name: string) {
        return this.productCategoryService.update(id, category_name);
    }

    @Delete('delete')
    remove(@Query('id') id: number) {
        return this.productCategoryService.remove(id);
    }
}

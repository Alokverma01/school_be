import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './asset.dto';

@Controller('asset')
export class AssetController {
  constructor(private readonly service: AssetService) {}

  @Post('create-asset')
  create(@Body() dto: CreateAssetDto) {
    return this.service.create(dto);
  }

  @Get('get-all-assets')
  getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getAll(page, limit);
  }

  @Get('get-asset-by-id') 
  getById(@Query('id') id: number) {
    return this.service.getById(Number(id));
  }

  @Put('update-asset')
  update(@Query('id') id: number, @Body() dto: any) {
    return this.service.update(Number(id), dto);
  }

  @Delete('delete-asset')
  delete(@Query('id') id: number) {
    return this.service.delete(Number(id));
  }

  @Get('search')
  searchAssets(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.searchAssets(keyword, page, limit);
  }

  @Post('filter')
  filterAssets  (
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.filterAssets(filters, page, limit);
  }
}

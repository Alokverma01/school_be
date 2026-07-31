import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { AssetLocationService } from './asset_location.service';

@Controller('asset-locations')
export class AssetLocationController {
  constructor(private readonly service: AssetLocationService) {}

  @Post('add')
  create(@Body('location_name') location_name: string) {
    return this.service.create(location_name);
  }

  @Get('get-all')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? parseInt(page) : undefined;
    const l = limit ? parseInt(limit) : undefined;
    return this.service.findAll(p, l);
  }

  @Get('get-by-id')
  findOne(@Query('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put('update')
  update(
    @Query('id') id: number,
    @Body('location_name') location_name: string,
  ) {
    return this.service.update(id, location_name);
  }

  @Delete('delete')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
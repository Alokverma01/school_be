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
import { AssetStatusService } from './asset_status.service';


@Controller('asset-status')
export class AssetStatusController {
  constructor(private readonly service: AssetStatusService) {}

  @Post('add')
  create(@Body('status_name') status_name: string) {
    return this.service.create(status_name);
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
  update(
    @Query('id') id: number,
    @Body('status_name') status_name: string,
  ) {
    return this.service.update(id, status_name);
  }

  @Delete('delete')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
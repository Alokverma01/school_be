import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { FeesTypesService } from './fees_types.service';

@Controller('fees-types')
export class FeesTypesController {
  constructor(private readonly feeTypeService: FeesTypesService) {}

  @Post('create')
  create(@Body('name') name: string) {
    return this.feeTypeService.create(name);
  }

  @Get('get-all')
  findAll() {
    return this.feeTypeService.findAll();
  }

  @Get('get-by-id')
  findOne(@Query('id') id: number) {
    return this.feeTypeService.findOne(id);
  }

  @Put('update')
  update(@Query('id') id: number, @Body('name') name: string) {
    return this.feeTypeService.update(id, name);
  }

  @Delete('delete')
  remove(@Query('id') id: number) {
    return this.feeTypeService.remove(id);
  }
}

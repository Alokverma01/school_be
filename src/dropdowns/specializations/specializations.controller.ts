import { Controller, Get, Post, Body, Delete, Query, Put } from '@nestjs/common';
import { SpecializationsService } from './specializations.service';

@Controller('specialization')
export class SpecializationsController {
  constructor(private readonly specializationsService: SpecializationsService) {}

  @Post('create')
  create(@Body('name') name: string) {
    return this.specializationsService.create(name);
  }

  @Get('get-all')
  findAll() {
    return this.specializationsService.findAll();
  }

  @Get('get-by-id')
  findOne(@Query('id') id: number) {
    return this.specializationsService.findOne(id);
  }

  @Put('update')
  update(@Query('id') id: number, @Body('name') name: string) {
    return this.specializationsService.update(id, name);
  }

  @Delete('delete')
  remove(@Query('id') id: number) {
    return this.specializationsService.remove(id);
  }
}

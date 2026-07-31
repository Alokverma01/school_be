import { Controller, Get, Post, Body, Delete, Query, Put } from '@nestjs/common';
import { QualificationsService } from './qualifications.service';

@Controller('qualifications')
export class QualificationsController {
  constructor(
    private readonly qualificationsService: QualificationsService,
  ) {}

  @Post('create')
  create(@Body('name') name: string) {
    return this.qualificationsService.create(name);
  }

  @Get('get-all')
  findAll() {
    return this.qualificationsService.findAll();
  }

  @Get('get-by-id')
  findOne(@Query('id') id: number) {
    return this.qualificationsService.findOne(id);
  }

  @Put('update')
  update(@Query('id') id: number, @Body('name') name: string) {
    return this.qualificationsService.update(id, name);
  }

  @Delete('delete')
  remove(@Query('id') id: number) {
    return this.qualificationsService.remove(id);
  }
}

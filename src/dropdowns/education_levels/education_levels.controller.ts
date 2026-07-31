import { Controller, Get, Post, Body, Delete, Query, Put } from '@nestjs/common';
import { EducationLevelsService } from './education_levels.service';

@Controller('education-level')
export class EducationLevelsController {
  constructor(private readonly educationLevelsService: EducationLevelsService) {}

  @Post('create')
  create(@Body('name') name: string) {
    return this.educationLevelsService.create(name);
  }

  @Get('get-all')
  findAll() {
    return this.educationLevelsService.findAll();
  }

  @Get('get-by-id')
  findOne(@Query('id') id: number) {
    return this.educationLevelsService.findOne(id);
  }

  @Put('update')
  update(@Query('id') id: number, @Body('name') name: string) {
    return this.educationLevelsService.update(id, name);
  }

  @Delete('delete')
  remove(@Query('id') id: number) {
    return this.educationLevelsService.remove(id);
  }
}
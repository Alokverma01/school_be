import { Controller, Get, Post, Body, Delete, Query, Put } from '@nestjs/common';
import { InstituteTypesService } from './institute_types.service';

@Controller('institute-type')
export class InstituteTypesController {
  constructor(private readonly instituteTypeService: InstituteTypesService) {}

  @Post('create')
  create(@Body('name') name: string) {
    return this.instituteTypeService.create(name);
  }

  @Get('get-all')
  findAll() {
    return this.instituteTypeService.findAll();
  }

  @Get('get-by-id')
  findOne(@Query('id') id: number) {
    return this.instituteTypeService.findOne(id);
  }

  @Put('update')
  update(@Query('id') id: number, @Body('name') name: string) {
    return this.instituteTypeService.update(id, name);
  }

  @Delete('delete')
  remove(@Query('id') id: number) {
    return this.instituteTypeService.remove(id);
  }
}

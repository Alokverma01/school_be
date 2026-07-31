import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { DegreeService } from './degree.service';

@Controller('degree')
export class DegreeController {
  constructor(private readonly degreeService: DegreeService) {}

  @Post("create")
  create(@Body('name') name: string) {
    return this.degreeService.create(name);
  }

  @Get("get-all")
  findAll() {
    return this.degreeService.findAll();
  }

  @Get('get-by-id')
  findOne(@Query('id') id: number) {
    return this.degreeService.findOne(id);
  }

  @Put('update')
  update(
    @Query('id') id: number,
    @Body('name') name: string,
  ) {
    return this.degreeService.update(id, name);
  }

  @Delete('delete')
  remove(@Query('id') id: number) {
    return this.degreeService.remove(id);
  }
}
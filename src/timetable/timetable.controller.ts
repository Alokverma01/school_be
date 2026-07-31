import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateTimetableDto } from './create-timetable.dto';

@Controller('timetable')
export class TimetableController {
  constructor(private readonly service: TimetableService) { }

  // Create or Update
  @Post('create-timetable')
  save(@Body() body: CreateTimetableDto) {
    return this.service.create(body);
  }

  @Get('get-all-timetable')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll(page, limit);
  }

  @Get('get-timetable-by-id')
  findOne(@Query('id') id: number) {
    return this.service.findOne(id);
  }

  // Handy for prefilling the UI based on dropdown selections
  @Get('get-by-class-and-section')
  findByClass(
    @Query('class_id') class_id: number,
    @Query('section_id') section_id: number,
    @Query('academic_year') academic_year: string,
  ) {
    return this.service.findByClassAndSection(class_id, section_id, academic_year);
  }

  @Put('update-timetable')
  update(@Query('id') id: number, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Get('search-timetable')
  search(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.search(keyword, page, limit);
  }

  @Post('filter-timetable')
  filter(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.filter(filters, page, limit);
  }

  @Delete('delete-timetable')
  remove(@Query('id') id: number) {
    return this.service.delete(id);
  }
}

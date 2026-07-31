import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './holidays.dto';

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post('create-holiday')
  create(@Body() dto: CreateHolidayDto) {
    return this.holidaysService.create(dto);
  }

  @Get('get-all-holidays')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.holidaysService.findAll(page, limit);
  }

  @Get('get-holiday-by-id')
  findOne(@Query('id', ParseIntPipe) id: number) {
    return this.holidaysService.findOne(id);
  }

  @Put('update-holiday')
  update(@Query('id') id: number, @Body() dto: any) {
    return this.holidaysService.updateHoliday(Number(id), dto);
  }

  @Delete('delete-holiday')
  remove(@Query('id', ParseIntPipe) id: number) {
    return this.holidaysService.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './complaints.dto';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly service: ComplaintsService) {}

  @Post('create-complaint')
  create(@Body() dto: CreateComplaintDto) {
    return this.service.create(dto);
  }

  @Get('get-all-complaints')
  getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getAll(page, limit);
  }

  @Get('get-complaint-by-id')
  getById(@Query('id') id: number) {
    return this.service.getById(Number(id));
  }

  @Put('update-complaint')
  updateComplaint(@Query('id') id: number, @Body() dto: any) {
    return this.service.updateComplaint(Number(id), dto);
  }

  @Delete('delete-complaint')
  delete(@Query('id') id: number) {
    return this.service.delete(Number(id));
  }

  @Get('search')
  searchComplaints(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.searchComplaints(keyword, page, limit);
  }

  @Post('filter')
  filterComplaints(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.filterComplaints(filters, page, limit);
  }
}

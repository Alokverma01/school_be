import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TeacherPayrollLeaveService } from './teacher-payroll-leave.service';
import {
  CreatePayrollDto,
  CreateTeacherLeaveDto,
} from './teacher-payroll-leave.dto';

@Controller('payroll')
export class TeacherPayrollLeaveController {
  constructor(
    private readonly teacherPayrollLeaveService: TeacherPayrollLeaveService,
  ) {}

  @Post('create')
  create(@Body() body: CreatePayrollDto) {
    return this.teacherPayrollLeaveService.createPayroll(body);
  }

  @Get('get-all')
  getAllPayroll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.teacherPayrollLeaveService.getAllPayroll(page, limit);
  }

  @Get('get-by-id')
  getPayrollById(@Query('id') id: number) {
    return this.teacherPayrollLeaveService.getPayrollById(id);
  }

  @Put('update')
  updatePayroll(@Query('id') id: number, @Body() body: CreatePayrollDto) {
    return this.teacherPayrollLeaveService.updatePayroll(id, body);
  }

  @Delete('delete')
  deletePayroll(@Query('id') id: number) {
    return this.teacherPayrollLeaveService.deletePayroll(id);
  }

  @Get('search-payroll')
  searchPayroll(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.teacherPayrollLeaveService.searchPayroll(keyword, page, limit);
  }

  @Post('filter-payroll')
  filterPayroll(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.teacherPayrollLeaveService.filterPayroll(filters, page, limit);
  }

  // leave
  @Post('apply')
  apply(@Body() body: CreateTeacherLeaveDto) {
    return this.teacherPayrollLeaveService.applyLeave(body);
  }

  @Get('get-all-leave')
  getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.teacherPayrollLeaveService.getAllLeaves(page, limit);
  }

  @Put('update-leave')
  update(@Query('id') id: number, @Body() body: CreateTeacherLeaveDto) {
    return this.teacherPayrollLeaveService.updateLeave(id, body);
  }

  @Delete('delete-leave')
  delete(@Query('id') id: number) {
    return this.teacherPayrollLeaveService.deleteLeave(id);
  }

  @Get('get-leave-by-id')
  getLeaveById(@Query('id') id: number) {
    return this.teacherPayrollLeaveService.getLeaveById(id);
  }

  @Get('search-leave')
  searchLeaves(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.teacherPayrollLeaveService.searchLeaves(keyword, page, limit);
  }

  @Post('filter-leave')
  filterLeaves(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.teacherPayrollLeaveService.filterLeaves(filters, page, limit);
  }
}

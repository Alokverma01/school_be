import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { AddDepartmentDto } from './add-department.dto';

@Controller('department')
export class DepartmentController {
  constructor(private readonly deptService: DepartmentService) {}

  @Get('get-all-departments')
  getAllDepartments() {
    return this.deptService.findAll();
  }

  @Post('add-department')
  addDepartment(@Body() dto: AddDepartmentDto) {
    return this.deptService.create(dto);
  }

  @Get('search')
  searchDepartments(
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.deptService.search(keyword, page, limit);
  }
}

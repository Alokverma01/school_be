import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './teacher.dto';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly service: TeachersService) { }

  @Post('create-teacher')
  create(@Body() body: CreateTeacherDto) {
    return this.service.create(body);
  }

  @Get('get-teachers-by-branch')
  getTeachersByBranch(@Query('branch_id') branch_id: number) {
    return this.service.findByBranchId(branch_id);
  }

  @Get('get-teachers-by-id')
  getTeachersById(@Query('teacher_id') teacher_id: number) {
    return this.service.findById(teacher_id);
  }

  @Get('get-all-teachers')
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAll(page, limit);
  }


  @Put('update-teacher')
  updateTeacher(@Query('teacher_id') teacher_id: number, @Body() body: any) {
    return this.service.update(teacher_id, body);
  }

  @Delete('delete-teacher')
  delete(@Query('teacher_id') teacher_id: number) {
    return this.service.delete(teacher_id);
  }

  @Get('search')
  async searchTeachers(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.searchTeachers(keyword, page, limit);
  }

  @Post('filter')
  async filterTeachers(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.filterTeachers(filters, page, limit);
  }

  @Get('get-teachers-by-branch-subject')
  async getTeachersBySubject(
    @Query('branch_id') branch_id: number,
    @Query('master_subject_id') master_subject_id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findBySubjectId(branch_id, master_subject_id, page, limit);
  }

  @Get('get-teachers-by-branch-class-subject')
  async getTeachersByBranchClassSubject(
    @Query('branch_id') branch_id: number,
    @Query('class_id') class_id: number,
    @Query('subject_id') subject_id: number,
  ) {
    return this.service.findByBranchClassSubject(
      branch_id,
      class_id,
      subject_id,
    );
  }
}

import { SubjectsService } from './subjects.service';
import { Subject } from './subject.entity';
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AssignTeacherSubjectDto, CreateSubjectDto } from './subject.dto';

@Controller('subjects')
export class SubjectsController {
  constructor(readonly SubjectsService: SubjectsService) { }

  @Post('create-subject')
  async createSubject(@Body() body: CreateSubjectDto) {
    console.log("body", body);
    return this.SubjectsService.createSubject(body);
  }

  @Put('update-subject')
  async updateSubject(
    @Query('subject_id') subject_id: number,
    @Body() body: CreateSubjectDto,
  ) {
    return this.SubjectsService.updateSubject(subject_id, body);
  }

  @Get('get-all-subjects')
  async getAllSubjects(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.SubjectsService.getAllSubjects(page, limit);
  }

  @Get('get-subject-by-id')
  async getSubjectById(@Query('subject_id') subject_id: number) {
    return this.SubjectsService.getsubjectById(subject_id);
  }

  @Get('get-subject-by-class-and-branch')
  async getsubjectByBranchAndClassId(
    @Query('class_id') class_id: number,
    @Query('branch_id') branch_id: number,
  ) {
    return this.SubjectsService.getsubjectByBranchAndClassId(class_id, branch_id);
  }

  @Delete('delete-subject')
  async deleteSubject(@Query('subject_id') subject_id: number) {
    return this.SubjectsService.deleteSubject(subject_id);
  }

  @Get('search')
  async searchStudents(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.SubjectsService.searchSubjects(keyword, page, limit);
  }

  @Post('filter')
  filterSubjects(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.SubjectsService.filterSubjects(filters, page, limit);
  }

  // assign teacher to subject
  @Post('assign-teacher')
  async assignTeacherSubject(@Body() body: AssignTeacherSubjectDto) {
    return this.SubjectsService.assignTeacherSubject(body);
  }

  @Put('update-assign-teacher')
  async updateAssignTeacherSubject(
    @Query('id') id: number,
    @Body() body: AssignTeacherSubjectDto,
  ) {
    return this.SubjectsService.updateAssignTeacherSubject(id, body);
  }

  @Get('get-assign-subject-teachers')
  async getAssignSubjectTeachers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.SubjectsService.getAssignSubjectTeachers(page, limit);
  }

  @Get('get-assign-teacher-by-id')
  async getAssignTeacherById(@Query('id') id: number) {
    return this.SubjectsService.getAssignTeacherById(id);
  }

  @Delete('delete-assign-teacher')
  async deleteAssignTeacher(@Query('id') id: number) {
    return this.SubjectsService.deleteAssignTeacher(id);
  }

  @Get('search-assign-teacher')
  async searchAssignTeacher(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.SubjectsService.searchAssignTeacher(keyword, page, limit);
  }

  @Post('filter-assign-teacher')
  async filterAssignTeacher(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.SubjectsService.filterAssignTeacher(filters, page, limit);
  }
}

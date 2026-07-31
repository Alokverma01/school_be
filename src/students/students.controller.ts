import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateStudentDto } from './student.dto';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentService: StudentsService) {}

  @Post('create-student')
  async createStudent(@Body() body: CreateStudentDto) {
    return this.studentService.createStudent(body);
  }

  @Get('get-all-students')
  async getAllStudents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentService.getAllStudents(page, limit);
  }

  @Get('get-student-by-id')
  async getStudentById(@Query('student_id') student_id: number) {
    return this.studentService.getStudentById(student_id);
  }

  @Get('get-students-by-class-and-sections')
  async getStudentsByBranchClassAndSection(
    @Query('branch_id') branch_id: number,
    @Query('class_id') class_id: number,
    @Query('section_id') section_id: number,
  ) {
    console.log("data", branch_id, class_id, section_id)
    return await this.studentService.getStudentsByBranchClassAndSection(branch_id,class_id,section_id);
  }

  @Put('update-student')
  async updateStudent(
    @Query('student_id') student_id: number,
    @Body() body: any,
  ) {
    return this.studentService.updateStudent(student_id, body);
  }

  @Delete('delete-student')
  async deleteStudent(@Query('student_id') student_id: number) {
    return this.studentService.deleteStudent(student_id);
  }

  @Get('search')
  async searchStudents(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentService.searchStudents(keyword, page, limit);
  }

  @Post('filter')
  filterUsers(
    @Body() filters?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentService.filterStudents(filters, page, limit);
  }
}

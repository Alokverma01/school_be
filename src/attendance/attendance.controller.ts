import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkTeacherAttendanceDto, MarkStudentAttendanceDto } from './mark_attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) { }

  // ============ TEACHER ATTENDANCE ============

  @Post('teacher/mark')
  async markTeacherAttendance(@Body() dto: MarkTeacherAttendanceDto) {
    return this.attendanceService.markTeacherAttendance(dto);
  }

  @Post('teacher/checkout')
  async teacherCheckOut(@Body() dto: { branch_id: number; teacher_id: number }) {
    return this.attendanceService.teacherCheckOut(dto);
  }

  @Get('teacher/get')
  async getTeacherAttendance(
    @Query('teacher_id') teacher_id?: number,
    @Query('branch_id') branch_id?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.getTeacherAttendance(
      teacher_id,
      branch_id,
      page,
      limit,
      date,
    );
  }

  @Get('teacher/search')
  async searchTeacherAttendance(
    @Query('keyword') keyword: string,
    @Query('branch_id') branch_id?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.attendanceService.searchTeacherAttendance(
      keyword,
      branch_id,
      page,
      limit,
    );
  }

  // ============ STUDENT ATTENDANCE ============

  @Post('student/mark')
  async markStudentAttendance(@Body() dto: MarkStudentAttendanceDto) {
    return this.attendanceService.markStudentAttendance(dto);
  }

  @Get('student/get')

  async getStudentAttendance(
    @Query('student_id') student_id?: number,
    @Query('branch_id') branch_id?: number,
    @Query('class_id') class_id?: number,
    @Query('section_id') section_id?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.getStudentAttendance(
      student_id,
      branch_id,
      class_id,
      section_id,
      page,
      limit,
      date,
    );
  }

  @Get('student/search')
  async searchStudentAttendance(
    @Query('keyword') keyword: string,
    @Query('branch_id') branch_id?: number,
    @Query('class_id') class_id?: number,
    @Query('section_id') section_id?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.attendanceService.searchStudentAttendance(
      keyword,
      branch_id,
      class_id,
      section_id,
      page,
      limit,
    );
  }
}

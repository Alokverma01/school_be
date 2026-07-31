import { IsNotEmpty, IsNumber, IsIn, IsOptional, IsDateString } from 'class-validator';

export class MarkTeacherAttendanceDto {
  @IsNotEmpty({ message: 'Branch ID is required' })
  @IsNumber()
  branch_id: number;

  @IsNotEmpty({ message: 'Teacher ID is required' })
  @IsNumber()
  teacher_id: number;

  @IsOptional()
  @IsDateString()
  date?: string; // Optional, defaults to today

  @IsOptional()
  @IsNumber()
  @IsIn([0, 1, 2], { message: 'Attendance status must be 0 (absent), 1 (present), or 2 (late)' })
  attendance_status?: number; // Optional, auto-calculated based on time

  @IsOptional()
  check_in?: string;

  @IsOptional()
  check_out?: string;
}

export class MarkStudentAttendanceDto {
  @IsNotEmpty({ message: 'Branch ID is required' })
  @IsNumber()
  branch_id: number;

  @IsNotEmpty({ message: 'Class ID is required' })
  @IsNumber()
  class_id: number;

  @IsNotEmpty({ message: 'Section ID is required' })
  @IsNumber()
  section_id: number;

  @IsNotEmpty({ message: 'Student ID is required' })
  @IsNumber()
  student_id: number;

  @IsOptional()
  @IsDateString()
  date?: string; // Optional, defaults to today

  @IsOptional()
  @IsNumber()
  @IsIn([0, 1, 2], { message: 'Attendance status must be 0 (absent), 1 (present), or 2 (late)' })
  attendance_status?: number; // Optional, auto-calculated based on time
}

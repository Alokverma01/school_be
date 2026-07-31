import { IsNotEmpty, IsNumber, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateTimetableDto {
  @IsNotEmpty()
  @IsNumber()
  branch_id!: number;

  @IsNotEmpty()
  @IsNumber()
  class_id!: number;

  @IsNotEmpty()
  @IsNumber()
  section_id!: number;

  @IsString()
  academic_year!: string;

  @IsOptional()
  @IsObject()
  periods?: any; // { Mon: [], Tue: [], ... }

  @IsOptional()
  @IsNumber()
  subject_id?: number;

  @IsOptional()
  @IsNumber()
  teacher_id?: number;

  @IsOptional()
  @IsNumber()
  room_id?: number;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsString()
  day_of_week?: string;

  @IsOptional()
  @IsNumber()
  period_number?: number;

  @IsOptional()
  @IsString()
  period_type?: string;
}

import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAssignmentDto {
  @IsInt({ message: 'branch_id must be an integer' })
  @IsOptional()
  @Type(() => Number)
  branch_id?: number;

  @IsInt({ message: 'class_id must be an integer' })
  @IsOptional()
  @Type(() => Number)
  class_id?: number;

  @IsInt({ message: 'section_id must be an integer' })
  @IsOptional()
  @Type(() => Number)
  section_id?: number;

  @IsInt({ message: 'subject_id must be an integer' })
  @IsOptional()
  @Type(() => Number)
  subject_id?: number;

  @IsInt({ message: 'teacher_id must be an integer' })
  @IsOptional()
  @Type(() => Number)
  teacher_id?: number;

  @IsString({ message: 'title must be a string' })
  @IsOptional()
  title?: string;

  @IsString({ message: 'instructions must be a string' })
  @IsOptional()
  instructions?: string;

  @IsString({ message: 'file_url must be a string' })
  @IsOptional()
  file_url?: string;

  // Backwards-compatible alias used by the frontend.
  @IsOptional()
  @IsString({ message: 'attachment must be a string' })
  attachment?: string;

  @IsDateString({}, {
    message: 'due_date must be a valid date string (YYYY-MM-DD)',
  })
  @IsOptional()
  due_date?: string;
}

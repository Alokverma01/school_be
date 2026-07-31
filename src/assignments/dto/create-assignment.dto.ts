import { Type } from 'class-transformer';
import { IsInt, IsString, IsDateString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAssignmentDto {
  @IsInt({ message: 'branch_id must be an integer' })
  @IsNotEmpty({ message: 'branch_id is required' })
  @Type(() => Number)
  branch_id: number;

  @IsInt({ message: 'class_id must be an integer' })
  @IsNotEmpty({ message: 'class_id is required' })
  @Type(() => Number)
  class_id: number;

  @IsInt({ message: 'section_id must be an integer' })
  @IsNotEmpty({ message: 'section_id is required' })
  @Type(() => Number)
  section_id: number;

  @IsInt({ message: 'subject_id must be an integer' })
  @IsNotEmpty({ message: 'subject_id is required' })
  @Type(() => Number)
  subject_id: number;

  @IsInt({ message: 'teacher_id must be an integer' })
  @IsNotEmpty({ message: 'teacher_id is required' })
  @Type(() => Number)
  teacher_id: number;

  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title: string;

  @IsString({ message: 'instructions must be a string' })
  @IsNotEmpty({ message: 'instructions is required' })
  instructions: string;

  // Optional when no assignment file is uploaded.
  @IsOptional()
  @IsString({ message: 'file_url must be a string' })
  file_url?: string;

  // Backwards-compatible alias used by the frontend.
  @IsOptional()
  @IsString({ message: 'attachment must be a string' })
  attachment?: string;

  @IsDateString()
  @IsNotEmpty({ message: 'due_date is required' })
  due_date: string;
}

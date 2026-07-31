import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubmissionDto {
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

  @IsInt({ message: 'assignment_id must be an integer' })
  @IsNotEmpty({ message: 'assignment_id is required' })
  @Type(() => Number)
  assignment_id: number;

  @IsInt({ message: 'student_id must be an integer' })
  @IsNotEmpty({ message: 'student_id is required' })
  @Type(() => Number)
  student_id: number;

  @IsString({ message: 'file_url must be a string' })
  file_url: string;

  @IsNumber({}, { message: 'marks must be a number' })
  @Min(0, { message: 'marks cannot be negative' })
  @Type(() => Number)
  marks: number;

  @IsString({ message: 'remarks must be a string' })
  @IsOptional()
  remarks?: string;
}

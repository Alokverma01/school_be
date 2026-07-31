import { IsOptional, IsString, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubmissionDto {
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

  @IsInt({ message: 'assignment_id must be an integer' })
  @IsOptional()
  @Type(() => Number)
  assignment_id?: number;

  @IsInt({ message: 'student_id must be an integer' })
  @IsOptional()
  @Type(() => Number)
  student_id?: number;

  @IsString({ message: 'file_url must be a string' })
  @IsOptional()
  file_url?: string;

  @IsNumber({}, { message: 'marks must be a number' })
  @IsOptional()
  @Min(0, { message: 'marks cannot be negative' })
  @Type(() => Number)
  marks?: number;

  @IsString({ message: 'remarks must be a string' })
  @IsOptional()
  remarks?: string;
}

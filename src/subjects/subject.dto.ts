import { IsNotEmpty, IsEnum, IsInt, IsString, IsOptional } from 'class-validator';

export class CreateSubjectDto {

  @IsInt({ message: 'branch_id must be a number' })
  @IsNotEmpty({ message: 'branch_id is required' })
  branch_id!: number;

  @IsInt({ message: 'class_id must be a number' })
  @IsNotEmpty({ message: 'class_id is required' })
  class_id!: number;

  @IsInt({ message: 'master_subject_id must be a number' })
  @IsOptional()
  master_subject_id?: number;

  @IsString({ message: 'name must be a string' })
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty({ message: 'Subject code is required' })
  code!: string;

  @IsEnum(['theory', 'practical'], {
    message: 'Subject type must be one of: theory, practical'
  })
  type!: string;
}

export class AssignTeacherSubjectDto {

  @IsInt()
  @IsNotEmpty({ message: 'teacher_id is required' })
  teacher_id!: number;

  @IsInt()
  @IsNotEmpty({ message: 'subject_id is required' })
  subject_id!: number;

  @IsInt()
  @IsNotEmpty({ message: 'class_id is required' })
  class_id!: number;

  @IsInt()
  @IsNotEmpty({ message: 'branch_id is required' })
  branch_id!: number;
}
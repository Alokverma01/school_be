import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsDateString, IsOptional, IsArray, ValidateNested } from 'class-validator';

export class CreateExamMasterDto {

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  branch_id!: number;

  @IsNotEmpty()
  @IsString()
  exam_name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_id?: number;

  @IsNotEmpty({ message: 'exam_type_id is required' })
  @Type(() => Number)
  @IsNumber()
  exam_type_id!: number;
  

  // @IsNotEmpty()
  // @IsNumber()
  // exam_type: number;

  @IsNotEmpty({ message: "academic_year is required" })
  @IsString()
  academic_year!: string;

  @IsNotEmpty({ message: "start_date is required" })
  @IsDateString()
  start_date!: string;

  @IsNotEmpty({ message: "end_date is required" })
  @IsDateString()
  end_date!: string;

  @IsNotEmpty({ message: "exam_status is required" })
  @IsEnum(['draft', 'published'], {
    message: "exam_status must be the following value : draft , published"
  })
  exam_status!: 'draft' | 'published'

 @IsOptional()
@IsArray()
subject_details?: {
  subject_id: number;
  exam_date: string;
  start_time?: string;
  end_time?: string;
  max_marks: number;
  passing_marks: number;
}[];
}


export class CreateExamTypeDto {
  @IsNotEmpty({ message: 'exam_type is required' })
  @IsString()
  exam_type!: string;
}

export class CreateExamSubjectMappingDto {
  @IsNotEmpty({ message: "exam_id is required" })
  @IsNumber()
  exam_id!: number;

  @IsNotEmpty({ message: "subject_id is required" })
  @IsNumber()
  subject_id!: number;

  @IsNotEmpty({ message: "max_marks is required" })
  @IsNumber()
  max_marks!: number;

  @IsNotEmpty({ message: "passing_marks is required" })
  @IsNumber()
  passing_marks!: number;

  @IsNotEmpty({ message: "exam_date is required" })
  @IsDateString()
  exam_date!: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;
}

export class MarksDetailDto {
  @IsNotEmpty()
  @IsNumber()
  subject_id!: number;

  @IsNotEmpty()
  @IsNumber()
  obtained_marks!: number;

  @IsNotEmpty()
  @IsNumber()
  max_marks!: number;

  @IsNotEmpty()
  @IsNumber()
  passing_marks!: number;
}

export class CreateExamResultDto {
  @IsNotEmpty()
  @IsNumber()
  exam_id!: number;

  @IsNotEmpty()
  @IsNumber()
  student_id!: number;

  @IsNotEmpty()
  @IsNumber()
  branch_id!: number;

  @IsNotEmpty()
  @IsNumber()
  class_id!: number;

  @IsNotEmpty()
  @IsNumber()
  section_id!: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarksDetailDto)
  marks_details!: MarksDetailDto[]; // Array of subjects

  @IsNotEmpty()
  @IsNumber()
  total_obtained_marks!: number;

  @IsNotEmpty()
  @IsNumber()
  total_max_marks!: number;

  @IsNotEmpty()
  @IsNumber()
  percentage!: number;

  @IsNotEmpty()
  @IsString()
  grade!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

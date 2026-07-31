import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateComplaintDto {
  @IsNotEmpty({ message: 'Branch is required' })
  @IsInt({ message: 'branch_id must be an integer' })
  branch_id: number;

  @IsNotEmpty({ message: 'Raised By is required' })
  @IsEnum(['student', 'teacher'], {
    message: 'raised_by must be student or teacher',
  })
  raised_by: 'student' | 'teacher';

  @IsNotEmpty({ message: 'Raised By ID is required' })
  @IsInt({ message: 'raised_by_id must be an integer' })
  raised_by_id: number;

  // Only required if raised_by === 'student'
  @ValidateIf((o) => o.raised_by === 'student')
  @IsNotEmpty({ message: 'Class is required for student' })
  @IsInt({ message: 'raised_by_class_id must be an integer' })
  raised_by_class_id: number;

  @ValidateIf((o) => o.raised_by === 'student')
  @IsNotEmpty({ message: 'Section is required for student' })
  @IsInt({ message: 'raised_by_section_id must be an integer' })
  raised_by_section_id: number;

  @IsNotEmpty({ message: 'Complaint Type is required' })
  @IsEnum(['teacher', 'student'], {
    message: 'complaint_type must be teacher or student',
  })
  complaint_type: 'teacher' | 'student';

  @IsNotEmpty({ message: 'Against ID is required' })
  @IsInt({ message: 'against_id must be an integer' })
  against_id: number;

  // Only required if complaint_type === 'student'
  @ValidateIf((o) => o.complaint_type === 'student')
  @IsNotEmpty({
    message: 'Class is required when complaining against a student',
  })
  @IsInt()
  against_class_id: number;

  @ValidateIf((o) => o.complaint_type === 'student')
  @IsNotEmpty({
    message: 'Section is required when complaining against a student',
  })
  @IsInt()
  against_section_id: number;

  @IsNotEmpty({ message: 'Priority is required' })
  @IsEnum(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high';

  @IsNotEmpty({ message: 'Complaint Status is required' })
  @IsEnum(['open', 'resolved', 'closed'])
  complaint_status: 'open' | 'resolved' | 'closed';

  @IsNotEmpty({ message: 'Message is required' })
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  resolution_note?: string;
}

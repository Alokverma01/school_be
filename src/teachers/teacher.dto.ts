import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';


export class CreateTeacherDto {
  @IsNotEmpty({ message: 'branch_id is required' })
  @IsNumber()
  branch_id: number;

  @IsNotEmpty({ message: 'first_name is required' })
  @IsString()
  first_name: string;

  @IsNotEmpty({ message: 'last_name is required' })
  @IsString()
  last_name: string;

  @IsNotEmpty({ message: 'email is required' })
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'contact_number is required' })
  @IsString()
  @Length(10, 10)
  contact_number: string;

  @IsNotEmpty({ message: 'teacher_aadhaar is required' })
  @IsString()
  @Length(12, 12)
  teacher_aadhaar: string;

  @IsNotEmpty({ message: 'experience_years is required' })
  @IsString()
  experience_years: string;

  @IsNotEmpty({ message: 'joining_date is required' })
  @IsString()
  joining_date: string;

  // NEW: Qualification as Array
  @IsArray({ message: 'qualification must be an array' })
  @ValidateNested({ each: true })
  @Type(() => QualificationDto)
  qualification: QualificationDto[];


  @IsNotEmpty({ message: 'emergency_contact_number is required' })
  @IsString()
  @Length(10, 10)
  emergency_contact_number: string;

  @IsNotEmpty({ message: 'address is required' })
  @IsString()
  address: string;

  @IsNotEmpty({ message: 'expertise_one_id is required' })
  @IsNumber()
  expertise_one_id: number;

  @IsOptional()
  @IsNumber()
  expertise_two_id?: number;

}


export class QualificationDto {
  @IsNotEmpty({ message: 'qualification_type is required' })
  @IsString()
  qualification_type: string;

  @IsNotEmpty({ message: 'degree_name is required' })
  @IsString()
  degree_name: string;

  @IsNotEmpty({ message: 'specialization is required' })
  @IsString()
  specialization: string;

  @IsNotEmpty({ message: 'education_level is required' })
  @IsString()
  education_level: string;

  @IsNotEmpty({ message: 'institute_name is required' })
  @IsString()
  institute_name: string;

  @IsNotEmpty({ message: 'institute_type is required' })
  @IsString()
  institute_type: string;

  @IsNotEmpty({ message: 'institute_address is required' })
  @IsString()
  institute_address: string;

  @IsNotEmpty({ message: 'teaching_eligibility_exam is required' })
  @IsString()
  teaching_eligibility_exam: string;

  @IsNotEmpty({ message: 'certificate_number is required' })
  @IsString()
  certificate_number: string;

  @IsNotEmpty({ message: 'passing_year is required' })
  @IsString()
  passing_year: string;
}

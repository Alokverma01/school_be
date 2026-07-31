import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsEmail, IsBoolean, IsDateString, IsNumber, IsEnum, ValidateNested, IsArray, IsOptional } from 'class-validator';



export class SiblingDto {
  @IsNotEmpty()
  sibling_id: number;

  @IsEnum(['brother', 'sister', 'twin'])
  relation_type: string;
}

export class HealthDto {
  
  @IsNotEmpty({message: 'blood_group is required'})
  @IsEnum([
    'A+','A-','B+','B-','AB+','AB-','O+','O-'
  ])
  blood_group: string;

  @IsNotEmpty({message: 'allergies is required'})
  @IsString()
  allergies: string;

  
  @IsNotEmpty({message: 'medical_conditions is required'})
  @IsString()
  medical_conditions: string;
}


export class CreateStudentDto {

  // Foreign Keys
  @IsNotEmpty({message: 'branch_id is required'})
  @IsNumber()
  branch_id: number;

  @IsNotEmpty({message: 'class_id is required'})
  @IsNumber()
  class_id: number;

  @IsNotEmpty({message: 'section_id is required'})
  @IsNumber()
  section_id: number;

  // Student Info
  @IsNotEmpty({message: 'first_name is required'})
  @IsString()
  first_name: string;

  @IsNotEmpty({message: 'last_name is required'})
  @IsString()
  last_name: string;

  @IsNotEmpty({message: 'dob is required'})
  @IsDateString({})
  dob: string;

  @IsNotEmpty({message: 'email is required'})
  @IsEmail()
  email: string;

  @IsNotEmpty({message: 'gender is required'})
  @IsString()
  gender: string;

  @IsNotEmpty({message: 'student_aadhar is required'})
  @IsString()
  student_aadhar: string;

  @IsNotEmpty({message: 'admission_number is required'})
  @IsString()
  admission_number: string;

  @IsNotEmpty({message: 'roll_number is required'})
  @IsNumber()
  roll_number: number;

  @IsNotEmpty({message: 'is_EWS is required'})
  @IsBoolean()
  is_EWS: boolean;

  @IsNotEmpty({message: 'address is required'})
  @IsString()
  address: string;

  @IsNotEmpty({message: 'parent_first_name is required'})
  @IsString()
  parent_first_name: string;

  @IsNotEmpty({message: 'parent_last_name is required'})
  @IsString()
  parent_last_name: string;

  @IsNotEmpty({message: 'parent_contact is required'})
  @IsString()
  parent_contact: string;

  @IsNotEmpty({message: 'parent_aadhar is required'})
  @IsString()
  parent_aadhar: string;

  @IsNotEmpty({message: 'relation is required'})
  @IsString()
  relation: string;

  @IsNotEmpty({message: 'parent_email is required'})
  @IsEmail()
  parent_email: string;

  @ValidateNested()
  @Type(() => HealthDto)
  health: HealthDto;

 // OPTIONAL
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiblingDto)
  siblings?: SiblingDto[];
}



import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserType } from './certificate.entity';


export class CreateCertificateDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  branch_id: number;

  @IsNotEmpty()
  @IsEnum(UserType)
  issued_to: UserType;

  @ValidateIf((o) => o.issued_to === UserType.STUDENT)
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'Class is required for students' })
  class_id?: number;

  @ValidateIf((o) => o.issued_to === UserType.STUDENT)
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'Section is required for students' })
  section_id?: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  user_id: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  certificate_type_id: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsString() // Format: YYYY-MM-DD
  issue_date: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  uploaded_by: number;
}

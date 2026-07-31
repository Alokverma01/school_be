import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsEnum,
  IsPositive,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PaymentDetailDto {
  @IsNotEmpty({ message: 'fee_structure_id is required' })
  @IsNumber({}, { message: 'fee_structure_id must be a number' })
  fee_structure_id: number;

  @IsNotEmpty({ message: 'amount_paid is required' })
  @IsPositive({ message: 'amount_paid must be positive' })
  amount_paid: number;
}

export class CreateFeePaymentDto {
  @IsNotEmpty({ message: 'branch_id is required' })
  @IsNumber({}, { message: 'branch_id must be a number' })
  branch_id: number;

  @IsNotEmpty({ message: 'class_id is required' })
  @IsNumber({}, { message: 'class_id must be a number' })
  class_id: number;

  @IsNotEmpty({ message: 'section_id is required' })
  @IsNumber({}, { message: 'section_id must be a number' })
  section_id: number;

  @IsNotEmpty({ message: 'student_id is required' })
  @IsNumber({}, { message: 'student_id must be a number' })
  student_id: number;

  @IsNotEmpty({ message: 'payment_date is required' })
  @IsDateString({}, { message: 'payment_date must be a valid date (YYYY-MM-DD)' })
  payment_date: string;

  @IsNotEmpty({ message: 'payment_mode is required' })
  @IsNumber({}, { message: 'payment_mode must be a number' })
  payment_mode: number; // e.g., 1=Cash, 2=Card, etc.

  @IsNotEmpty({ message: 'total_amount_paid is required' })
  @IsPositive({ message: 'total_amount_paid must be positive' })
  total_amount_paid: number;

  @IsArray({ message: 'details must be an array' })
  @ArrayNotEmpty({ message: 'At least one fee detail is required' })
  @ValidateNested({ each: true })
  @Type(() => PaymentDetailDto)
  details: PaymentDetailDto[];
}

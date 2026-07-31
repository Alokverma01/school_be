import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  IsInt,
  Min,
} from 'class-validator';

export enum FeeTypeId {
  TUITION = 1,
  HOSTEL = 2,
  TRANSPORT = 3,
}

export class CreateFeeStructureDto {
  @IsNotEmpty()
  @IsInt()
  branch_id: number;

  @IsNotEmpty()
  @IsNumber()
  fee_type_id: number;

  @ValidateIf((o) => o.fee_type_id === FeeTypeId.TUITION)
  @IsNotEmpty({ message: 'Class is required for tuition fee' })
  @IsInt()
  class_id?: number;

  @ValidateIf((o) => o.fee_type_id === FeeTypeId.TRANSPORT)
  @IsNotEmpty({ message: 'Route is required for transport fee' })
  @IsInt()
  route_id?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
}

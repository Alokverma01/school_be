import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBranchDto {
  @IsNotEmpty({ message: 'branch_code is required' })
  @IsString()
  branch_code!: string;

  @IsNotEmpty({ message: 'branch_name is required' })
  @IsString()
  branch_name!: string;

  @IsNotEmpty({ message: 'address is required' })
  @IsString()
  address!: string;

  // PRINCIPAL USER ID
  @IsNotEmpty({message: 'principal_id is required' })
  @IsInt()
  principal_id!: number;

  @IsNotEmpty({ message: 'total_classes is required' })
  @IsNumber()
  total_classes!: number;

  @IsNotEmpty({ message: 'total_students is required' })
  @IsNumber()
  total_students!: number;
}

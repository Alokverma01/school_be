import {
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  item_name: string;

  @IsInt()
  category_id: number;

  @IsInt()
  branch_id: number;

  @IsInt()
  quantity: number;

  @IsNumber()
  unit_cost: number;

  @IsString()
  vendor: string;
}

// export class UpdateInventoryDto {
//   @IsOptional()
//   @IsString()
//   item_name?: string;

//   @IsOptional()
//   @IsString()
//   category?: string;

//   @IsOptional()
//   @IsInt()
//   quantity?: number;

//   @IsOptional()
//   @IsNumber()
//   unit_cost?: number;

//   @IsOptional()
//   @IsString()
//   vendor?: string;

//   @IsOptional()
//   @IsDateString()
//   expiry_date?: string;
// }

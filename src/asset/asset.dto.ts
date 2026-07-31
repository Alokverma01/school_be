// src/asset/dto/create-asset.dto.ts
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateAssetDto {
  @IsNotEmpty({ message: 'Branch is required' })
  @IsInt()
  branch_id: number;

  @IsNotEmpty({ message: 'Asset name is required' })
  @IsString()
  asset_name: string;

  @IsNotEmpty({ message: 'Category is required' })
  @IsInt()
  category_id: number;

  @IsNotEmpty({ message: 'Location is required' })
  @IsInt()
  location_id: number;

  @IsNotEmpty({ message: 'Status is required' })
  @IsInt()
  status_id: number;

  @IsNotEmpty({ message: 'Purchase date is required' })
  @IsDateString()
  purchase_date: string; // YYYY-MM-DD format

  @IsNotEmpty({ message: 'Cost is required' })
  @IsNumber({}, { message: 'Cost must be a number' })
  @IsPositive({ message: 'Cost must be positive' })
  cost: number;

  @IsOptional()
  @IsDateString()
  warranty_expiry?: string | null; // YYYY-MM-DD or null
}
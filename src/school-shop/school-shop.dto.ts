import { Type } from 'class-transformer';
import { IsInt, IsString, IsNumber, IsArray, Min, ValidateNested } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsNumber()
  price: number;

  @IsInt()
  stock: number;
}

export class OrderItemDto {
  @IsInt({ message: 'Product ID must be an integer' })
  product_id: number;

  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

export class CreateOrderDto {
  @IsInt({ message: 'Branch ID is required' })
  branch_id: number;

  @IsInt({ message: 'Class ID is required' })
  class_id: number;

  @IsInt({ message: 'Section ID is required' })
  section_id: number;

  @IsInt({ message: 'Student ID is required' })
  student_id: number;

  @IsArray({ message: 'Items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

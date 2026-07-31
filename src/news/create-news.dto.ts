
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateNewsDto {
  @IsNotEmpty({ message: 'news_code is required' })
  @IsString({ message: 'news_code must be a string' })
  news_code: string;

  @IsNotEmpty({ message: 'branch_id is required' })
  @IsInt({ message: 'branch_id must be an integer' })
  @Min(1, { message: 'branch_id must be a positive integer' })
  branch_id: number;

  @IsNotEmpty({ message: 'news_date is required' })
  @IsDateString({}, { message: 'news_date must be a valid date (YYYY-MM-DD)' })
  news_date: string; // e.g., "2025-12-25"

  @IsNotEmpty({ message: 'news_title is required' })
  @IsString({ message: 'news_title must be a string' })
  news_title: string;

  @IsNotEmpty({ message: 'message is required' })
  @IsString({ message: 'message must be a string' })
  message: string;
}

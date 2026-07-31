import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  ValidateIf,
  IsInt,
} from 'class-validator';

/* BOOK */
export class CreateBookDto {
  @IsNotEmpty()
  branch_id: number;

  @IsNotEmpty()
  isbn: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  author: string;

  @IsNotEmpty()
  category: string;

  @IsNotEmpty()
  publisher: string;

  @IsNotEmpty()
  @IsNumber()
  total_copies: number;

  @IsNotEmpty()
  @IsNumber()
  available_copies: number;
}

/* BOOK ISSUE */
export class IssueBookDto {
  @IsNotEmpty()
  @IsNumber()
  book_id: number;

  @IsNotEmpty()
  @IsNumber()
  branch_id: number;

// Only required if issued_to === 'student'
  @ValidateIf(o => o.issued_to === 'student')
  @IsInt()
  class_id: number;

  // Only required if issued_to === 'student'
  @ValidateIf(o => o.issued_to === 'student')
  @IsInt()
  section_id: number;

  @IsNotEmpty()
  @IsEnum(['student', 'teacher'])
  issued_to: 'student' | 'teacher';

  @IsNotEmpty()
  @IsNumber()
  issued_to_id: number;

  @IsNotEmpty()
  @IsDateString()
  issued_date: string;

  @IsNotEmpty()
  @IsDateString()
  return_date: string;

  @IsNotEmpty()
  fine_amount: string;
}

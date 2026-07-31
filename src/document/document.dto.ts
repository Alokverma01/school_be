import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { DocUserType } from './document.entity';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @Type(() => Number) // <--- Add this to convert "1" -> 1
  @IsInt()
  branch_id: number;

  @IsString() // Enums usually accept strings directly
  doc_user_type: string;

  @Type(() => Number) // <--- Add this
  @IsInt()
  @IsOptional()
  class_id?: number;

  @Type(() => Number) // <--- Add this
  @IsInt()
  @IsOptional()
  section_id?: number;

  @Type(() => Number) // <--- Add this
  @IsInt()
  user_id: number;

  @Type(() => Number) // <--- Add this
  @IsInt()
  doc_type_id: number;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // A document can be supplied either as multipart field `file` or as a
  // pre-uploaded URL.  The service already supports this fallback.
  // @IsString()
  // @IsOptional()
  // file_url?: string;
  @IsOptional()
@IsString()
file_url?: string;

  // Ensure issue_date is handled as needed (string or Date)
  @IsOptional()
  issue_date: string;

  @Type(() => Number) // <--- Add this
  @IsOptional()
  uploaded_by?: number;

}

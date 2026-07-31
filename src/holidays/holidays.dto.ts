import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum HolidayCategory {
  NATIONAL = 'national',
  RELIGIOUS = 'religious',
  SCHOOL = 'school',
}

export class CreateHolidayDto {
  @IsNotEmpty()
  @IsString()
  holiday_name: string;

  @IsDateString()
  date: string;

  @IsEnum(HolidayCategory)
  category: HolidayCategory;

  @IsOptional()
  @IsString()
  description?: string;
}



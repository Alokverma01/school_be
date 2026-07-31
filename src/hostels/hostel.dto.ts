import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  isNotEmpty,
  Matches,
  IsIn,
} from 'class-validator';

export class CreateHostelDto {
  @IsNotEmpty({ message: 'Hostel name is required' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Branch ID is required' })
  @IsNumber()
  branch_id: number;

  @IsNotEmpty({ message: 'Hostel type is required' })
  @IsNumber()
  @IsIn([0, 1, 2], {
    message: 'Hostel type must be 0 (boys), 1 (girls), or 2 (staff)',
  })
  type: number;

  @IsNotEmpty({ message: 'Total rooms is required' })
  @IsNumber()
  total_rooms: number;

  @IsNotEmpty({ message: 'Warden name is required' })
  @IsString()
  warden_name: string;

  @IsNotEmpty({ message: 'Date of joining is required' })
  @IsDateString()
  date_of_joining: string;

  @IsNotEmpty({ message: 'Contact number is required' })
  @Matches(/^[0-9]{10}$/, {
    message: 'Contact number must be exactly 10 digits',
  })
  contact_number: string;

  @IsNotEmpty({ message: 'Aadhar number is required' })
  @IsString()
  aadhar_number: string;

  @IsString()
  warden_address: string;
}

// export class UpdateHostelDto {
//   @IsOptional() @IsString() name?: string;
//   @IsOptional() @IsEnum(['boys', 'girls', 'staff']) type?: string;
//   @IsOptional() @IsNumber() total_rooms?: number;
//   @IsOptional() @IsString() warden_name?: string;
//   @IsOptional() @IsDateString() date_of_joining?: string;
//   @IsOptional() @IsString() contact_number?: string;
//   @IsOptional() @IsString() adhar_number?: string;
//   @IsOptional() @IsString() warden_address?: string;
// }

export class CreateHostelRoomDto {
  @IsNumber()
  @IsNotEmpty({ message: 'Branch ID is required' })
  branch_id: number;

  @IsNumber()
  @IsNotEmpty({ message: 'Hostel ID is required' })
  hostel_id: number;

  @IsNotEmpty({ message: 'Room number is required' })
  @IsString()
  room_number: string;

  @IsNotEmpty({ message: 'Bed count is required' })
  @IsNumber()
  bed_count: number;
}

// export class UpdateHostelRoomDto {
//   @IsOptional() @IsNumber() hostel_id?: number;
//   @IsOptional() @IsString() room_number?: string;
//   @IsOptional() @IsNumber() bed_count?: number;
// }

export class CreateHostelAllocationDto {
  @IsNotEmpty({ message: 'branch_id is required' })
  @IsNumber()
  branch_id: number;

  @IsNotEmpty({ message: 'hostel_id is required' })
  @IsNumber()
  hostel_id: number;

  @IsNotEmpty({ message: 'hostel_room_id is required' })
  @IsNumber()
  hostel_room_id: number;

  @IsNotEmpty({ message: 'class_id is required' })
  @IsNumber()
  class_id: number;

  @IsNotEmpty({ message: 'section_id is required' })
  @IsNumber()
  section_id: number;

  @IsNotEmpty({ message: 'student_id is required' })
  @IsNumber()
  student_id: number;

  @IsNotEmpty({ message: 'start_date is required' })
  @IsDateString()
  start_date: string;

  @IsNotEmpty({ message: 'end_date is required' })
  @IsDateString()
  end_date: string;
}

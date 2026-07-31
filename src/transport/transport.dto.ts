import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsPositive,
} from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  vehicle_no: string;

  @IsNotEmpty()
  @IsNumber()
  branch_id: number;

  @IsNotEmpty()
  @IsNumber()
  vehicle_type_id: number;

  @IsNotEmpty()
  @IsNumber()
  capacity: number;

  @IsNotEmpty()
  @IsNumber()
  driver_id: number;

  @IsDateString()
  maintenance_due_date: string;

  @IsDateString()
  insurance_expiry: string;
}

export class CreateRouteDto {
  @IsNotEmpty()
  @IsString()
  route_name: string;

  @IsNotEmpty()
  @IsString()
  start_point: string;

  @IsNotEmpty()
  @IsString()
  end_point: string;

  @IsNotEmpty()
  @IsNumber()
  vehicle_id: number;

  @IsNotEmpty()
  @IsNumber()
  branch_id: number;
}


export class AssignStudentTransportDto {
  @IsNotEmpty({ message: 'Branch is required' })
  @IsNumber({}, { message: 'Branch must be a number' })
  branch_id: number;

  @IsNotEmpty({ message: 'Class is required' })
  @IsNumber({}, { message: 'Class must be a number' })
  class_id: number;

  @IsNotEmpty({ message: 'Section is required' })
  @IsNumber({}, { message: 'Section must be a number' })
  section_id: number;

  @IsNotEmpty({ message: 'Student is required' })
  @IsNumber({}, { message: 'Student must be a number' })
  student_id: number;

  @IsNotEmpty({ message: 'Fee structure is required' })
  @IsNumber({}, { message: 'Fee structure must be a number' })
  fee_structure_id: number;

  @IsNotEmpty({ message: 'Pickup location is required' })
  @IsString()
  pickup_location: string;

  @IsNotEmpty({ message: 'Drop location is required' })
  @IsString()
  drop_location: string;
}
import {
  IsDate,
  IsDateString,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  maxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsDefined({ message: 'first name is required' })
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsDefined({ message: 'Last name is required' })
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsDefined({ message: 'username is required' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsDefined({ message: 'Email is required' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsString()
  email: string;

  @IsDefined({ message: 'Password is required' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @IsDefined({ message: 'Contact number is required' })
  @Matches(/^[0-9]+$/, { message: 'Contact number must contain only digits' })
  @MinLength(10, { message: 'Contact number must be 10 digits' })
  @MaxLength(10, { message: 'Contact number must be 10 digits' })
  contact_number: string;

  @IsDefined({ message: 'role_id is required' })
  @IsNotEmpty()
  @IsNumber()
  role_id: number;

  @IsDefined()
  reporting_to: number;

  @IsDefined({ message: 'date_of_birth is required' })
  @IsNotEmpty({ message: 'date_of_birth cannot be empty' })
  @IsDateString({}, { message: 'date_of_birth must be a valid date string' })
  date_of_birth: string;

  @IsDefined({ message: 'date_of_joining is required' })
  @IsNotEmpty({ message: 'date_of_joining cannot be empty' })
  @IsDateString({}, { message: 'date_of_joining must be a valid date string' })
  date_of_joining: string;

  //user-details
  @IsDefined({ message: 'address is required' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsDefined({ message: 'city is required' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @IsDefined({ message: 'state is required' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @IsDefined({ message: 'pincode is required' })
  @IsNotEmpty()
  pincode: string;

  @IsDefined({ message: 'bank_name is required' })
  @IsNotEmpty()
  @IsString()
  bank_name: string;

  @IsDefined({ message: 'account_no is required' })
  @IsNotEmpty()
  account_no: string;

  @IsDefined({ message: 'ifsc_code is required' })
  @IsNotEmpty()
  @IsString()
  ifsc_code: string;

  @IsDefined({ message: 'branch is required' })
  @IsNotEmpty()
  @IsString()
  branch: string;
}

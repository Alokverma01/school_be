import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateRoleDto {
  @IsDefined({ message: 'Role name is required' })
  @IsNotEmpty()
  @IsString()
  role_name: string;

  // @IsDefined({ message: 'Reports to is required' })
  @ValidateIf((o) => o.reports_to !== null && o.reports_to !== '')
  @IsNumber({}, { message: 'Reports to must be a number' })
  reports_to: number | null;

  @IsDefined({ message: 'Department is required' })
  @IsNumber({}, { message: 'Department must be a number' })
  department: number;

  @IsDefined({ message: 'Permissions is required' })
  @IsObject({ message: 'Permissions must be an object' })
  access: Record<string, boolean>;
}

import { IsNotEmpty, IsString, MinLength, Matches } from "class-validator";

export class AddDepartmentDto {

  @IsString()
  @IsNotEmpty({ message: "Department name is required" })
  department_name: string;
}
 
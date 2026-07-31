import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty({message : "branch_id is required"})
  @IsNumber()
  branch_id: number;

  @IsNotEmpty({message : "name is required"})
  @IsString()
  name: string;

  @IsEnum(['classroom', 'lab', 'library'], {
    message: 'Type must be one of: classroom, lab, library',
  })
  type: string;

  @IsNumber()
  capacity: number;
}

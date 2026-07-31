import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './create-room.dts';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @Post('create-room')
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get('get-all-rooms')
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.roomsService.findAll(page, limit);
  }

  @Get('get-room-by-id')
  findOne(@Query('room_id') room_id: number) {
    return this.roomsService.findById(room_id);
  }

  @Put('update-room')
  update(@Query('room_id') room_id: number, @Body() dto: CreateRoomDto) {
    return this.roomsService.update(room_id, dto);
  }

  @Delete('delete-room')
  delete(@Query('room_id') room_id: number) {
    return this.roomsService.delete(room_id);
  }

  @Get('get-rooms-by-branch-id-and-type')
  findByBranchIdAndType(@Query('branch_id') branch_id: number, @Query('type') type?: string) {
    return this.roomsService.findByBranchIdAndType(branch_id, type);
  }

  @Get('search')
  async searchRooms(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.roomsService.searchRooms(keyword, page, limit);
  }
  @Post('filter-rooms')
  async filterRooms(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.roomsService.filterRooms(filters, page, limit);
  }
}

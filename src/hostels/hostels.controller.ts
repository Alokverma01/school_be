import {
  CreateHostelAllocationDto,
  CreateHostelDto,
  CreateHostelRoomDto,
} from './hostel.dto';
import { HostelsService } from './hostels.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';

@Controller('hostels')
export class HostelsController {
  constructor(readonly HostelsService: HostelsService) {}
  // create hostel
  @Post('create-hostel')
  async createHostel(@Body() body: CreateHostelDto) {
    return this.HostelsService.createHostel(body);
  }

  @Get('get-all-hostels')
  async getAllHostels(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.HostelsService.getAllHostels(page, limit);
  }

  @Get('get-hostel-by-id')
  async getHostelById(@Query('hostel_id') hostel_id: number) {
    return this.HostelsService.getHostelById(hostel_id);
  }

  @Get('get-hostel-by-branch')
  async getHostelByBranchId(@Query('branch_id') branch_id: number) {
    return this.HostelsService.getHostelByBranchId(branch_id);
  }

  @Put('update-hostel')
  async updateHostel(
    @Query('hostel_id') hostel_id: number,
    @Body() body: CreateHostelDto,
  ) {
    return this.HostelsService.updateHostel(hostel_id, body);
  }

  @Delete('delete-hostel')
  async deleteHostel(@Query('hostel_id') hostel_id: number) {
    return this.HostelsService.deleteHostel(hostel_id);
  }

  @Get('search-hostel')
  async searchHostels(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.HostelsService.searchHostels(keyword, page, limit);
  }

  @Post('filter-hostel')
  filterHostels(
    @Body() filters?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.HostelsService.filterHostels(filters, page, limit);
  }

  // hostel rooms
  @Post('add-room')
  async createHostelRoom(@Body() body: CreateHostelRoomDto) {
    return this.HostelsService.createRoom(body);
  }

  @Put('update-room')
  async updateHostelRoom(
    @Query('room_id') room_id: number,
    @Body() body: CreateHostelRoomDto,
  ) {
    return this.HostelsService.updateRoom(room_id, body);
  }

  @Get('get-all-rooms')
  async getAllHostelRooms(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.HostelsService.getAllRooms(page, limit);
  }

  @Get('get-room-by-id')
  async getHostelRoomById(@Query('room_id') room_id: number) {
    return this.HostelsService.getRoomById(room_id);
  }

  @Get('get-rooms-by-hostel')
  async getHostelRoomByHostelId(@Query('hostel_id') hostel_id: number) {
    return this.HostelsService.getHostelRoomByHostelId(hostel_id);
  }

  @Delete('delete-room')
  async deleteHostelRoom(@Query('room_id') room_id: number) {
    return this.HostelsService.deleteRoom(room_id);
  }

  @Get('search-hostel-room')
  async searchHostelRooms(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.HostelsService.searchRooms(keyword, page, limit);
  }

  @Post('filter-hostel-room')
  filterHostelRoom(
    @Body() filters?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.HostelsService.filterRooms(filters, page, limit);
  }

  // hostel allocations
  @Post('allocate-room')
  async allocateHostelRoom(@Body() body: CreateHostelAllocationDto) {
    return this.HostelsService.allocateRoom(body);
  }

  @Put('update-allocate-room')
  async updateHostelAllocation(
    @Query('allocation_id') allocation_id: number,
    @Body() body: CreateHostelAllocationDto,
  ) {
    return this.HostelsService.updateAllocation(allocation_id, body);
  }

  @Get('get-all-allocations-room')
  async getAllHostelAllocations(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.HostelsService.getAllAllocations(page, limit);
  }

  @Get('get-allocation-room-by-id')
  async getHostelAllocationById(@Query('allocation_id') allocation_id: number) {
    return this.HostelsService.getAllocationById(allocation_id);
  }

  @Delete('delete-allocation-room')
  async deleteHostelAllocation(@Query('allocation_id') allocation_id: number) {
    return this.HostelsService.deleteAllocation(allocation_id);
  }

  @Get('search-allocation-room')
  async searchAllocations(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.HostelsService.searchAllocations(keyword, page, limit);
  }

  @Post('filter-allocation-room')
  filterAllocations(
    @Body() filters?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.HostelsService.filterAllocations(filters, page, limit);
  }
}

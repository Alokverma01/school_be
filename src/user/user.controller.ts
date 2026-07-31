import { UserService } from './user.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('add-user')
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get('get-all-users')
  getAllUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.userService.findAll(page, limit);
  }

  @Get('get-user-by-id')
  getUserById(@Query('user_id') user_id: number) {
    return this.userService.findById(user_id);
  }

  @Get('reporting-to')
  async getReportingUsers(@Query('role_id') role_id: number) {
    return this.userService.getUsersReportingTo(role_id);
  }

  @Put('update-user')
  updateRole(@Query('user_id') user_id: number, @Body() data: any) {
    return this.userService.update(user_id, data);
  }

  @Delete('delete-user')
  deleteRole(@Query('user_id') user_id: number) {
    return this.userService.delete(user_id);
  }

  @Get('search')
  async searchUsers(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userService.search(keyword, page, limit);
  }

  @Post('filter')
  filterUsers(
    @Body() filters?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userService.filter(filters, page, limit);
  }
}

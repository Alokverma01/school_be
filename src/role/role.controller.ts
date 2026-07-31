import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './create-role.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('add-role')
  createRole(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Get('get-all-roles')
  getAllRoles(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.roleService.findAll(page, limit);
  }

  @Get('get-role-by-id')
  getById(@Query('role_id') role_id: number) {
    return this.roleService.findById(role_id);
  }

  @Put('update-role')
  updateRole(@Query('role_id') role_id: number, @Body() dto: CreateRoleDto) {
    return this.roleService.update(role_id, dto);
  }

  @Delete('delete-role')
  deleteRole(@Query('role_id') role_id: number) {
    return this.roleService.delete(role_id);
  }

  @Get('search')
  async searchRoles(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.roleService.search(keyword, page, limit);
  }

  @Post('filter')
  filterRoles(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Body() filters?: any,
  ) {
    return this.roleService.filterRoles(filters, page, limit);
  }
}

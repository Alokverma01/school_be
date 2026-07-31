import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './create-branch.dto';

@Controller('branches')
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Post('create-branch')
  async createBranch(@Body() data: CreateBranchDto) {
    return this.branchesService.create(data);
  }

  @Get('get-principals')
  async getPrincipals() {
    return this.branchesService.getPrincipals();
  }

  @Get('get-all-branches')
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.branchesService.findAll(page, limit);
  }

  @Get('get-branch-by-id')
  findById(@Query('branch_id', ParseIntPipe) branch_id: number) {
    return this.branchesService.findById(branch_id);
  }

  @Put('update-branch')
  update(
    @Query('branch_id', ParseIntPipe) branch_id: number,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.update(branch_id, dto);
  }

  @Delete('delete-branch')
  delete(@Query('branch_id', ParseIntPipe) branch_id: number) {
    return this.branchesService.delete(branch_id);
  }

  @Get('search')
  searchBranches(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.branchesService.search(keyword, page, limit);
  }

  @Post('filter')
  filterUsers(
    @Body() filters?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.branchesService.filter(filters, page, limit);
  }
}

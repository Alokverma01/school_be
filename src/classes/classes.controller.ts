import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Put,
  Query,
  Delete,
} from '@nestjs/common';
import { ClassesService } from './classes.service';

@Controller('class')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) { }

  @Post('create-class')
  async createClass(@Body() body) {
    return await this.classesService.createClass(body);
  }

  @Get('get-all-classes')
  async findAllClass(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.classesService.getAllClass(page, limit);
  }

  @Put('update-class')
  async updateClass(
    @Query('id') id: number,
    @Body() body) {
    return await this.classesService.updateClass(id, body);
  }

  @Delete('delete-class')
  async deleteClass(@Query('id') id: number) {
    return await this.classesService.deleteClass(id);
  }

  @Get('get-by-id')
  async getClassById(@Query('id') id: number) {
    return await this.classesService.getClassById(id);
  }

  @Get('get-class-by-branch')
  async getClass(@Query('branch_id') branch_id: number) {
    return await this.classesService.getClassByBranch(branch_id);
  }

  @Get('get-sections-by-class')
  async getSections(@Query('class_id') class_id: number) {
    return await this.classesService.getSectionsByClass(class_id);
  }

  @Put('assign-class')
  async updateSection(@Body() body) {
    return await this.classesService.assignClass(body);
  }

  @Get('get-all-assign-classes')
  async findAllAssignClass(
    @Query('branch_id') branch_id?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.classesService.getAllAssignClass(branch_id, page, limit);
  }

  @Get('get-assign-class-by-id')
  async findAssignClassById(@Query('id') id: number) {
    return await this.classesService.getAssignClassById(id);
  }

  @Get('search')
  async searchClasses(
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.classesService.search(keyword, Number(page), Number(limit));
  }

  @Post('filter')
  filterUsers(
    @Body() filters?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.classesService.filter(filters, page, limit);
  }
}

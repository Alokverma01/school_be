import {
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  CreateSubmissionDto,
  UpdateSubmissionDto,
} from './dto';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) { }

  // ---------- Assignments ----------
  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async createAssignment(
    @Body() dto: CreateAssignmentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assignmentsService.createAssignment(dto, file);
  }

  @Get('all')
  getAssignments(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.assignmentsService.getAssignments(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('get-by-id')
  getAssignmentById(@Query('id') id: number) {
    return this.assignmentsService.getAssignmentById(id);
  }

  @Get('get-by-branch-class-section')
  getAssignmentsByBranchClassSection(
    @Query('branch_id') branch_id: number,
    @Query('class_id') class_id: number,
    @Query('section_id') section_id: number,
  ) {
    return this.assignmentsService.getAssignmentsByBranchClassAndSection(branch_id, class_id, section_id);
  }

  @Put('update')
  @UseInterceptors(FileInterceptor('file'))
  updateAssignment(
    @Query('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignmentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assignmentsService.updateAssignment(id, dto, file);
  }

  @Delete('delete')
  deleteAssignment(@Query('id', ParseIntPipe) id: number) {
    return this.assignmentsService.deleteAssignment(id);
  }

  @Get('search')
  async searchAssignments(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.assignmentsService.searchAssignments(keyword, page, limit);
  }

  @Post('filter')
  filterAssignments(
    @Body() filters?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.assignmentsService.filterAssignments(filters, page, limit);
  }

  // ---------- Assignment Submissions ----------
  @Post('submissions/create')
  @UseInterceptors(FileInterceptor('file'))
  createSubmission(
    @Body() dto: CreateSubmissionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assignmentsService.createSubmission(dto, file);
  }

  @Get('submissions/all')
  getSubmissions(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.assignmentsService.getSubmissions(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('submissions-by-id')
  getSubmissionById(@Query('id', ParseIntPipe) id: number) {
    return this.assignmentsService.getSubmissionById(id);
  }

  @Put('submissions/update')
  @UseInterceptors(FileInterceptor('file'))
  updateSubmission(
    @Query('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubmissionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assignmentsService.updateSubmission(id, dto, file);
  }

  @Delete('submissions/delete')
  deleteSubmission(@Query('id', ParseIntPipe) id: number) {
    return this.assignmentsService.deleteSubmission(id);
  }

  @Get('submissions/search')
  async searchSubmissions(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.assignmentsService.searchSubmissions(keyword, page, limit);
  }

  @Post('submissions/filter')
  filterSubmissions(
    @Body() filters?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.assignmentsService.filterSubmissions(filters, page, limit);
  }
}

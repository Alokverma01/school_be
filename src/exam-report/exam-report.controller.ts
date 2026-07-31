import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Query,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';

import { ExamReportService } from './exam-report.service';
import { ExamTypeService } from './exam_type.service';

import {
  CreateExamMasterDto,
  CreateExamResultDto,
  CreateExamTypeDto,
} from './exam-report.dto';


// ======================================================
// EXAM TYPE CONTROLLER
// ======================================================

@Controller('exam-type')
export class ExamTypeController {
  constructor(private readonly examTypeService: ExamTypeService) {}

  @Post('create')
  create(@Body() dto: CreateExamTypeDto) {
    return this.examTypeService.createExamType(dto);
  }

  @Put('update')
  update(
    @Query('exam_type_id', ParseIntPipe) exam_type_id: number,
    @Body() dto: CreateExamTypeDto,
  ) {
    return this.examTypeService.updateExamType(exam_type_id, dto);
  }

  @Get('get-by-id')
  getById(
    @Query('exam_type_id', ParseIntPipe) exam_type_id: number,
  ) {
    return this.examTypeService.getExamTypeById(exam_type_id);
  }

  @Get('get-all')
  getAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examTypeService.getAllExamTypes(page, limit);
  }

  @Delete('delete')
  delete(
    @Query('exam_type_id', ParseIntPipe) exam_type_id: number,
  ) {
    return this.examTypeService.deleteExamType(exam_type_id);
  }

  @Get('search')
  search(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examTypeService.searchExamType(keyword, page, limit);
  }

  @Post('filter')
  filter(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examTypeService.filterExamType(filters, page, limit);
  }
}



// ======================================================
// EXAM REPORT CONTROLLER
// ======================================================

@Controller('exam-report')
export class ExamReportController {
  constructor(private readonly examService: ExamReportService) {}

  // ================= EXAM MASTER =================

  @Post('create-exam')
  createExam(@Body() dto: CreateExamMasterDto) {
    return this.examService.createExam(dto);
  }

  @Put('update-exam')
  updateExam(
    @Query('exam_id', ParseIntPipe) exam_id: number,
    @Body() dto: CreateExamMasterDto,
  ) {
    return this.examService.updateExam(exam_id, dto);
  }

  @Get('get-exam-by-id')
  getExamById(
    @Query('exam_id', ParseIntPipe) exam_id: number,
  ) {
    return this.examService.getExamById(exam_id);
  }

  @Get('get-all-exam')
  getAllExams(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examService.getAllExams(page, limit);
  }

  @Get('get-exams-by-branch')
  getExamsByBranch(
    @Query('branch_id', ParseIntPipe) branch_id: number,
  ) {
    return this.examService.getExamsByBranch(branch_id);
  }

  @Get('search-exam')
  searchExam(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examService.searchExam(keyword, page, limit);
  }

  @Post('filter-exam')
  filterExam(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examService.filterExam(filters, page, limit);
  }

  @Delete('delete-exam')
  deleteExam(
    @Query('exam_id', ParseIntPipe) exam_id: number,
  ) {
    return this.examService.deleteExam(exam_id);
  }

  // ================= RESULT =================

  @Post('record-result')
  recordResult(@Body() dto: CreateExamResultDto) {
    return this.examService.recordResult(dto);
  }

  @Put('update-result')
  updateResult(
    @Query('id', ParseIntPipe) id: number,
    @Body() dto: CreateExamResultDto,
  ) {
    return this.examService.updateResult(id, dto);
  }

  @Get('get-result-by-id')
  getResultById(
    @Query('id', ParseIntPipe) id: number,
  ) {
    return this.examService.getResultById(id);
  }

  @Get('get-all-result')
  getAllResult(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examService.getAllResults(page, limit);
  }

  @Delete('delete-result')
  deleteResult(
    @Query('id', ParseIntPipe) id: number,
  ) {
    return this.examService.deleteResult(id);
  }

  @Get('search-result')
  searchResult(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examService.searchResult(keyword, page, limit);
  }

  @Post('filter-result')
  filterResult(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examService.filterResult(filters, page, limit);
  }
}
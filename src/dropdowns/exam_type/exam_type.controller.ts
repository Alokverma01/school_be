import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ExamTypeService } from './exam_type.service';
import { CreateExamTypeDto, UpdateExamTypeDto } from './exam_type.dto';

@Controller('exam-type')
export class ExamTypeController {
    constructor(private readonly examTypeService: ExamTypeService) {}

  @Post()
  create(@Body() dto: CreateExamTypeDto) {
    return this.examTypeService.create(dto.exam_type);
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? Number(page) : undefined;
    const l = limit ? Number(limit) : undefined;
    return this.examTypeService.findAll(p, l);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examTypeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamTypeDto,
  ) {
    if (dto.exam_type_id !== undefined && dto.exam_type_id !== id) {
      throw new BadRequestException('exam_type_id in the body must match the URL id');
    }
    return this.examTypeService.update(id, dto.exam_type);
  }

  @Put('update')
  updateLegacy(
    @Query('exam_type_id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamTypeDto,
  ) {
    if (dto.exam_type_id !== undefined && dto.exam_type_id !== id) {
      throw new BadRequestException('exam_type_id in the body must match the query id');
    }
    return this.examTypeService.update(id, dto.exam_type);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examTypeService.remove(id);
  }
}

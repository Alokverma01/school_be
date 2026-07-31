// src/document-type/document-type.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { DocumentTypeService } from './document_types.service';

@Controller('document-types')
export class DocumentTypeController {
  constructor(private readonly documentTypeService: DocumentTypeService) {}

  @Post('add')
  create(@Body() createDto: any) {
    return this.documentTypeService.create(createDto);
  }

  @Get('get-all')
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.documentTypeService.findAll(page, limit);
  }

  @Get('get-by-id')
  findOne(@Query('id', ParseIntPipe) id: number) {
    return this.documentTypeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Query('id', ParseIntPipe) id: number,
    @Body() updateDto: any,
  ) {
    return this.documentTypeService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentTypeService.remove(id);
  }
}
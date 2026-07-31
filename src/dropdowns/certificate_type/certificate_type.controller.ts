// src/certificate-type/certificate-type.controller.ts
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
import { CertificateTypeService } from './certificate_type.service';

@Controller('certificate-types')
export class CertificateTypeController {
  constructor(private readonly certificateTypeService: CertificateTypeService) {}

  @Post('add')
  async create(@Body('certificate_name') certificate_name: string) {
    return this.certificateTypeService.create(certificate_name);
  }

  @Get('get-all')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.certificateTypeService.findAll(pageNum, limitNum);
  }

  @Get('get-by-id')
  async findOne(@Query('id') id: number) {
    return this.certificateTypeService.findOne(id);
  }

  @Patch('update')
  async update(
    @Query('id') id: number,
    @Body('certificate_name') certificate_name: string,
  ) {
    return this.certificateTypeService.update(id, certificate_name);
  }

  @Delete('delte')
  async remove(@Query('id') id: number) {
    return this.certificateTypeService.remove(id);
  }
}
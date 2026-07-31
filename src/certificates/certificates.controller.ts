import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CertificateService } from './certificates.service';
import { CreateCertificateDto } from './certificate.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('certificate')
export class CertificateController {
  constructor(private readonly service: CertificateService) { }

  @Post('create-certificate')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() dto: CreateCertificateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.create(dto, file);
  }

  @Put('update-certificate')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Query('id') id: number,
    @Body() dto: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.update(Number(id), dto, file);
  }

  @Get('get-all-certificates')
  getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getAll(page, limit);
  }

  @Get('get-certificate-by-id')
  getById(@Query('id') id: number) {
    return this.service.getById(Number(id));
  }

  @Delete('delete-certificate')
  delete(@Query('id') id: number) {
    return this.service.delete(Number(id));
  }

  @Get('search')
  searchCertificates(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.searchCertificates(keyword, page, limit);
  }

  @Post('filter')
  filterCertificates(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.filterCertificates(filters, page, limit);
  }
}

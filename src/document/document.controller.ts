import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './document.service';
import { CreateDocumentDto } from './document.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import { GoogleDriveService } from '../common/services/google-drive.services';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService, private readonly googleDriveService: GoogleDriveService) { }

  @Post('create')
  @UseInterceptors(FileInterceptor('file'))  // 'file' is the form field name
  async create(
    @Body() body: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.createDocument(body, file);
  }

  @Put('update')
  update(@Query('document_id') document_id: number, @Body() body: any) {
    return this.documentsService.updateDocument(document_id, body);
  }

  @Get('get-all')
  getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.documentsService.getAllDocuments(page, limit);
  }

  @Get('get-by-id')
  getById(@Query('document_id') document_id: number) {
    return this.documentsService.getDocumentById(document_id);
  }

  @Delete('delete')
  delete(@Query('document_id') document_id: number) {
    return this.documentsService.deleteDocument(document_id);
  }

  @Get('search-documents')
  searchDocs(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.documentsService.searchDocuments(keyword, page, limit);
  }

  @Post('filter-documents')
  filterDocs(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.documentsService.filterDocuments(filters, page, limit);
  }
}

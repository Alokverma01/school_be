import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateBookDto, IssueBookDto } from './library.dto';

@Controller('library')
export class LibraryController {
  constructor(private readonly service: LibraryService) {}

  @Post('create-book')
  createBook(@Body() dto: CreateBookDto) {
    return this.service.createBook(dto);
  }

  @Put('update-book')
  updateBook(@Query('id') id: number, @Body() dto: any) {
    return this.service.updateBook(id, dto);
  }

  @Get('get-all-books')
  getAllBooks(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getAllBooks(page, limit);
  }

  @Get('get-book-by-id')
  getBookById(@Query('id') id: number) {
    return this.service.getBookById(id);
  }

  @Get('get-book-by-branch')
  getBooksByBranchId(@Query('branch_id') branch_id: number) {
    return this.service.getBooksByBranchId(branch_id);
  }

  @Delete('delete-book')
  deleteBook(@Query('id') id: number) {
    return this.service.deleteBook(id);
  }

  @Get('search-book')
  searchBook(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.searchBooks(keyword, page, limit);
  }

  @Post('filter-book')
  filterBook(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.filterBooks(filters, page, limit);
  }

  // book-issue
  @Post('issue-book')
  issueBook(@Body() dto: IssueBookDto) {
    return this.service.issueBook(dto);
  }

  @Put('update-issue-book')
  updateIssueBook(@Query('id') id: number, @Body() dto: any) {
    return this.service.updateIssueBook(id, dto);
  }

  @Get('get-all-issue-books')
  getAllIssuesBook(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { 
    return this.service.getAllIssuesBook(page, limit);
  }

  @Get('get-issue-book-by-id')
  getIssueBookById(@Query('id') id: number) {
    return this.service.getIssueBookById(id);
  }

  @Delete('delete-issue-book')
  deleteIssueBook(@Query('id') id: number) {
    return this.service.deleteIssueBook(id);
  }

  @Get('search-issue-book')
  searchIssuedBooks(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.searchIssuedBooks(keyword, page, limit);
  }

  @Post('filter-issue-book')
  filterIssuedBooks(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.filterIssuedBooks(filters, page, limit);
  }
}

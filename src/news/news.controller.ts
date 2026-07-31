import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Patch,
  Delete,
  Put,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './create-news.dto';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post('add-news')
  createNews(@Body() data: CreateNewsDto) {
    return this.newsService.create(data);
  }

  @Put('update-news')
  updateNews(@Query('id') id: number, @Body() data: CreateNewsDto) {
    return this.newsService.update(id, data);
  }

  @Get('get-all-news')
  getAllNews(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.newsService.findAll(page, limit);
  }

  @Get('get-news-by-id')
  getNewsById(@Query('id') id: number) {
    return this.newsService.findById(id);
  }

  @Delete('delete-news')
  deleteNews(@Query('id') id: number) {
    return this.newsService.delete(id);
  }

  @Get('search-news')
  searchNews(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.newsService.searchNews(keyword, page, limit);
  }

  @Post('filter')
  filterNews(
    @Body() filters: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.newsService.filterNews(filters, page, limit);
  }
}

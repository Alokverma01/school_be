import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Books } from './books.entity';
import { BookIssue } from './book_issue.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Books,BookIssue])],
  controllers: [LibraryController],
  providers: [LibraryService] 
})
export class LibraryModule {}

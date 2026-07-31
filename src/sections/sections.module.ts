import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sections } from './sections.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sections])],
  controllers: [SectionsController],
  providers: [SectionsService]
})
export class SectionsModule {}

import { Module } from '@nestjs/common';
import { EducationLevelsController } from './education_levels.controller';
import { EducationLevelsService } from './education_levels.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EducationLevel } from './education_level.entity';

@Module({
  imports:[TypeOrmModule.forFeature([EducationLevel])],
  controllers: [EducationLevelsController],
  providers: [EducationLevelsService]
})
export class EducationLevelsModule {}

import { Module } from '@nestjs/common';
import { ExamTypeController } from './exam_type.controller';
import { ExamTypeService } from './exam_type.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamTypes } from './exam_type.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ExamTypes])],
  controllers: [ExamTypeController],
  providers: [ExamTypeService]
})
export class ExamTypeModule {}

import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { Subject } from './subject.entity';
import { TeacherSubject } from './teacher_subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject , TeacherSubject])],
  controllers: [SubjectsController],
  providers: [SubjectsService]
})
export class SubjectsModule {}

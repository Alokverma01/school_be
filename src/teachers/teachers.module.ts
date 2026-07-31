import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teachers } from './teachers.entity';
import { TeacherQualifications } from './teachers-qualifications.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Teachers , TeacherQualifications])],
  controllers: [TeachersController],
  providers: [TeachersService]
})
export class TeachersModule {}

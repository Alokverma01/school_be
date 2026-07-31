import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Students } from './students.entity';
import { Parents } from './parents.entity';
import { StudentParentMapping } from './student_parent_mapping';
import { StudentSiblingMapping } from './student_sibling_mapping';
import { StudentHealth } from './student_health.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Students , Parents, StudentParentMapping , StudentSiblingMapping , StudentHealth])],
  controllers: [StudentsController],
  providers: [StudentsService]
})
export class StudentsModule {}

import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Classes } from './classes.entity';
import { ClassSectionAssign } from './class_section_assign.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Classes, ClassSectionAssign])],
  controllers: [ClassesController],
  providers: [ClassesService]
})
export class ClassesModule {}

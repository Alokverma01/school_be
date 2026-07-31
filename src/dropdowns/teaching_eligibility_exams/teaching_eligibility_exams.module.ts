import { Module } from '@nestjs/common';
import { TeachingEligibilityExamsController } from './teaching_eligibility_exams.controller';
import { TeachingEligibilityExamsService } from './teaching_eligibility_exams.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachingEligibilityExam } from './teaching_eligibility_exams.entity';

@Module({
  imports:[TypeOrmModule.forFeature([TeachingEligibilityExam])],
  controllers: [TeachingEligibilityExamsController],
  providers: [TeachingEligibilityExamsService]
})
export class TeachingEligibilityExamsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExamReportController } from './exam-report.controller';

import { ExamReportService } from './exam-report.service';

import { ExamMaster } from './exam_master.entity';
import { ExamSubjectMapping } from './exam_subject_mapping.entity';
import { ExamResult } from './exam_result.entity';
import { ExamResultSummary } from './exam_result_summary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamMaster,
      ExamSubjectMapping,
      ExamResult,
      ExamResultSummary,
    ]),
  ],
  controllers: [
    ExamReportController,
  ],
  providers: [
    ExamReportService,
  ],
})
export class ExamReportModule {}

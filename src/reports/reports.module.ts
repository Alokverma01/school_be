import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { BranchReportsService } from './services/branches/branch-reports.service';
import { AttendanceService } from './services/attendance/attendance-report.service';
import { StudentsService } from './services/students/students-report.service';
import { SalaryService } from './services/salary/salary-report.service';
import { LibraryReportsService } from './services/library/library-report.service';
import { ExamReportsService } from './services/exam/exam-result-reports.service';
import { CertificateReportService } from './services/certificate/certificate-report.service';
import { AssetReportService } from './services/asset/asset-report.service';
import { ComplaintsReportService } from './services/complaints/complaints-reports';
import { SchoolShopReportService } from './services/school-shop/school-shop-reports.service';
import { FeesReportService } from './services/fees/fees-report.service';
import { AssignmentReportService } from './services/assignment/assignment-report.service';
import { HostelReportService } from './services/hostel/hostel-report.service';
import { TimetableReportService } from './services/timetable/timetable-report.service';
import { TransportReportService } from './services/transport/transport-report.service';


@Module({
    controllers: [ReportsController],
    providers: [
        BranchReportsService,
        AttendanceService,
        StudentsService,
        SalaryService,
        LibraryReportsService,
        ExamReportsService,
        CertificateReportService,
        AssetReportService,
        ComplaintsReportService,
        SchoolShopReportService,
        FeesReportService,
        AssignmentReportService,
        HostelReportService,
        TimetableReportService,
        TransportReportService

    ],
    exports: [BranchReportsService],
})
export class ReportsModule { }


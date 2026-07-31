import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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


@Controller('reports')
export class ReportsController {
    constructor(private readonly branchReports: BranchReportsService,
        private readonly attendanceReports: AttendanceService,
        private readonly studentReports: StudentsService,
        private readonly salaryReports: SalaryService,
        private readonly libraryReports: LibraryReportsService,
        private readonly examReports: ExamReportsService,
        private readonly certificateReports: CertificateReportService,
        private readonly assetReports: AssetReportService,
        private readonly complaintsReports: ComplaintsReportService,
        private readonly shopReports: SchoolShopReportService,
        private readonly feesReports: FeesReportService,
        private readonly assignmentReports: AssignmentReportService,
        private readonly hostelReports: HostelReportService,
        private readonly timetableReports: TimetableReportService,
        private readonly transportReports: TransportReportService

    ) { }

    @Get('branch-summary')
    async getBranchSummary(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.getBranchSummary(page, limit);
    }

    @Get('branch-student-summary')
    async getBranchStudentSummary(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.getBranchStudentSummary(page, limit);
    }

    @Get('branch-staff-summary')
    async getBranchStaffSummary(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.getBranchStaffSummary(page, limit);
    }

    @Get('branch-class-summary')
    async getBranchClassSummary(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.getBranchClassSummary(page, limit);
    }

    @Get('branch-summary-search')
    async searchBranchSummary(@Query('keyword') keyword: string, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.searchBranchSummary(keyword, page, limit);
    }

    @Post('branch-summary-filter')
    async filterBranchSummary(@Body() filters: any, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.filterBranchSummary(filters, page, limit);
    }

    @Get('staff-list-by-branch')
    async getStaffListByBranch(@Query('branch_id') branch_id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.getStaffListByBranch(branch_id, page, limit);
    }

    @Get('staff-list-by-branch-search')
    async searchStaffListByBranch(@Query('keyword') keyword: string, @Query('branch_id') branch_id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.searchStaffListByBranch(keyword, branch_id, page, limit);
    }

    @Get('student-count-by-class-section')
    async getStudentCount(@Query('branch_id') branch_id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.getStudentCountByClassSection(branch_id, page, limit);
    }

    @Get('student-count-by-class-section-search')
    async searchStudentCount(@Query('branch_id') branch_id: number, @Query('keyword') keyword: string, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.searchStudentCount(keyword, branch_id, page, limit);
    }

    @Post('student-count-by-class-section-filter')
    async filterStudentCount(@Query('branch_id') branch_id: number, @Body() filters: any, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.filterStudentCountByClassSection(branch_id, filters, page, limit);
    }


    @Get('teachers-by-class-section')
    async getTeachers(@Query('branch_id') branch_id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.getTeachersByClassSection(branch_id, page, limit);
    }

    @Get('subject-teachers-by-class')
    async getSubjectTeachers(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.getSubjectWiseTeacherAllocation(branch_id, class_id, page, limit);
    }

    @Get('search-subject-teachers-by-class')
    async searchSubjectTeachers(
        @Query('keyword') keyword: string,
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.searchSubjectWiseTeacherAllocation(keyword, branch_id, class_id, page, limit);
    }

    @Get('teachers-by-class-section-search')
    async searchTeachers(@Query('keyword') keyword: string, @Query('branch_id') branch_id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.searchTeachersByClassSection(keyword, branch_id, page, limit);
    }

    @Post('teachers-by-class-section-filter')
    async filterTeachers(@Query('branch_id') branch_id: number, @Body() filters: any, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.filterTeachersByClassSection(branch_id, filters, page, limit);
    }

    @Get('subjects-by-class')
    async getSubjects(@Query('branch_id') branch_id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.getSubjectsByClass(branch_id, page, limit);
    }

    @Get('subjects-by-class-search')
    async searchSubjects(@Query('keyword') keyword: string, @Query('branch_id') branch_id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.searchSubjectsByClass(keyword, branch_id, page, limit);
    }

    @Post('subjects-by-class-filter')
    async filterSubjects(@Query('branch_id') branch_id: number, @Body() filters: any, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.filterSubjectsByClass(branch_id, filters, page, limit);
    }

    @Get('rooms-by-branch')
    async getRoomsAllocations(@Query('branch_id') branch_id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.getRoomsAllocations(branch_id, page, limit);
    }

    @Get('rooms-by-branch-search')
    async searchRoomsAllocations(@Query('keyword') keyword: string, @Query('branch_id') branch_id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.searchRoomsAllocations(keyword, branch_id, page, limit);
    }

    @Post('rooms-by-branch-filter')
    async filterRoomsAllocations(@Query('branch_id') branch_id: number, @Body() filters: any, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.branchReports.filterRoomsAllocations(branch_id, filters, page, limit);
    }

    // Attendance
    @Get('teacher-attendance')
    async getTeacherAttendance(@Query('branch_id') branch_id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.attendanceReports.getTeacherAttendance(branch_id, page, limit);
    }

    @Get('student-attendance')
    async getStudentAttendance(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id?: number,
        @Query('section_id') section_id?: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.attendanceReports.getStudentAttendance(branch_id, class_id, section_id, page, limit);
    }

    @Get('student-daily-attendance-summary')
    async getStudentDailySummary(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('date') date?: string
    ) {
        return this.attendanceReports.getStudentDailyAttendanceSummary(branch_id, class_id, section_id, date);
    }

    @Get('student-daily-attendance-list')
    async getStudentDailyList(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('date') date?: string
    ) {
        return this.attendanceReports.getStudentDailyAttendanceList(branch_id, class_id, section_id, date);
    }

    @Get('student-monthly-attendance-summary')
    async getStudentMonthlySummary(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('month') month: number,
        @Query('year') year: number
    ) {
        return this.attendanceReports.getStudentMonthlyAttendanceSummary(branch_id, class_id, section_id, month, year);
    }

    @Get('teacher-daily-attendance-summary')
    async getTeacherDailySummary(
        @Query('branch_id') branch_id?: number,
        @Query('date') date?: string
    ) {
        return this.attendanceReports.getTeacherDailyAttendanceSummary(date, branch_id);
    }

    @Get('teacher-daily-attendance-list')
    async getTeacherDailyList(
        @Query('branch_id') branch_id?: number,
        @Query('date') date?: string
    ) {
        return this.attendanceReports.getTeacherDailyAttendanceList(date, branch_id);
    }

    @Get('teacher-monthly-attendance-summary')
    async getTeacherMonthlySummary(
        @Query('branch_id') branch_id: number,
        @Query('month') month: number,
        @Query('year') year: number
    ) {
        return this.attendanceReports.getTeacherMonthlyAttendanceSummary(branch_id, month, year);
    }

    @Get('teacher-subject-allocation-by-class')
    async getTeacherSubjectAllocationByClass(
        @Query('branch_id') branch_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.branchReports.getTeacherSubjectAllocationByClass(branch_id, page, limit);
    }

    @Get('search-teacher-subject-allocation')
    async searchTeacherSubjectAllocation(
        @Query('keyword') keyword: string,
        @Query('branch_id') branch_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.branchReports.searchTeacherSubjectAllocation(keyword, branch_id, page, limit);
    }

    @Post('filter-teacher-subject-allocation')
    async filterTeacherSubjectAllocation(
        @Query('branch_id') branch_id: number,
        @Body() filters: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.branchReports.filterTeacherSubjectAllocation(branch_id, filters, page, limit);
    }

    // Students
    @Get('student-list')
    async getStudentList(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.studentReports.getStudentList(branch_id, class_id, section_id, page, limit);
    }

    @Get('student-list-search')
    async searchStudentList(
        @Query('keyword') keyword: string,
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.studentReports.searchStudentList(keyword, branch_id, class_id, section_id, page, limit);
    }

    @Post('student-list-filter')
    async filterStudentList(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Body() filters: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.studentReports.filterStudentList(filters, branch_id, class_id, section_id, page, limit);
    }

    // Salary Reports
    @Get('salary-report')
    async getSalaryReport(
        @Query('branch_id') branch_id: number,
        @Query('month') month: string,
        @Query('year') year: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.salaryReports.getMonthlySalaryReport(branch_id, month, year, page, limit);
    }

    @Get('salary-report-search')
    async searchSalaryReport(
        @Query('keyword') keyword: string,
        @Query('branch_id') branch_id: number,
        @Query('month') month: string,
        @Query('year') year: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.salaryReports.searchSalaryReport(keyword, branch_id, month, year, page, limit);
    }

    @Post('salary-report-filter')
    async filterSalaryReport(
        @Query('branch_id') branch_id: number,
        @Query('month') month: string,
        @Query('year') year: number,
        @Body() filters: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.salaryReports.filterSalaryReport(filters, branch_id, month, year, page, limit);
    }

    // Library Reports
    @Get('library-issue-return')
    async getLibraryIssueReturn(
        @Query('branch_id') branch_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.libraryReports.getIssueReturnReport(branch_id, page, limit);
    }

    @Get('library-popular-books')
    async getPopularBooks(
        @Query('branch_id') branch_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.libraryReports.getPopularBooks(branch_id, page, limit);
    }

    @Get('library-overdue-books')
    async getOverdueBooks(
        @Query('branch_id') branch_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.libraryReports.getOverdueBooks(branch_id, page, limit);
    }

    // Exam Reports
    @Get('exam-schedule')
    async getExamSchedule(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('exam_type') exam_type?: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.examReports.getExamSchedule(branch_id, class_id, exam_type, page, limit);
    }

    @Get('exam-performance-summary')
    async getPerformanceSummary(
        @Query('branch_id') branch_id: number,
        @Query('exam_id') exam_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('average') average?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.examReports.getPerformanceSummary(branch_id, exam_id, class_id, section_id, average, page, limit);
    }

    @Get('exam-subject-performance')
    async getSubjectWisePerformance(
        @Query('branch_id') branch_id: number,
        @Query('exam_id') exam_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number
    ) {
        return this.examReports.getSubjectWisePerformance(branch_id, exam_id, class_id, section_id);
    }

    @Get('exam-subject-performance-top-ten')
    async getTopTenSubjectWise(
        @Query('branch_id') branch_id: number,
        @Query('exam_id') exam_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('subject_id') subject_id: number
    ) {
        return this.examReports.getSubjectWiseTopTen(branch_id, exam_id, class_id, section_id, subject_id);
    }

    @Get('exam-pass-fail-sheet')
    async getPassFailSheet(
        @Query('branch_id') branch_id: number,
        @Query('exam_id') exam_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.examReports.getPassFailSheet(branch_id, exam_id, class_id, section_id, page, limit);
    }


    @Get('certificate-list')
    async getCertificatesList(
        @Query('branch_id') branch_id: number,
        @Query('issued_to') issued_to?: string,
        @Query('class_id') class_id?: number,
        @Query('section_id') section_id?: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.certificateReports.getCertificatesList(branch_id, issued_to, class_id, section_id, page, limit);
    }

    @Get('certificate-list-search')
    async searchCertificates(
        @Query('branch_id') branch_id: number,
        @Query('keyword') keyword: string,
        @Query('issued_to') issued_to: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.certificateReports.searchCertificates(branch_id, keyword, issued_to, page, limit);
    }

    // Asset Reports
    @Get('asset-summary')
    async getAssetSummary() {
        return this.assetReports.getAssetSummary();
    }

    @Get('asset-list')
    async getAssetList(
        @Query('branch_id') branch_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.assetReports.getAssetList(branch_id, page, limit);
    }

    // @Get('asset-depreciation')
    // async getDepreciationReport(
    //     @Query('branch_id') branch_id: number,
    //     @Query('rate') rate?: number
    // ) {
    //     return this.assetReports.getDepreciationReport(branch_id, rate);
    // }

    // Complaints Reports
    @Get('complaints-list')
    async getComplaintsList(
        @Query('branch_id') branch_id?: number,
        @Query('status') status?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.complaintsReports.getComplaintsList(branch_id, status, page, limit);
    }

    // School Shop Reports
    @Get('shop-sales-report')
    async getShopSalesReport(
        @Query('branch_id') branch_id: number,
        @Query('month') month?: number,
        @Query('year') year?: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.shopReports.getSalesReport(branch_id, month, year, page, limit);
    }

    @Get('shop-revenue-report')
    async getShopRevenueReport(
        @Query('branch_id') branch_id: number,
        @Query('month') month?: number,
        @Query('year') year?: number
    ) {
        return this.shopReports.getRevenueReport(branch_id, month, year);
    }

    @Get('fees-collection-report')
    async getFeesCollectionReport(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('month') month?: number,
        @Query('year') year?: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.feesReports.getFeesCollectionReport(branch_id, class_id, section_id, month, year, page, limit);
    }

    @Get('fees-collection-report-search')
    async searchFeesCollectionReport(
        @Query('keyword') keyword: string,
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('month') month?: number,
        @Query('year') year?: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.feesReports.searchFeesCollectionReport(keyword, branch_id, class_id, section_id, month, year, page, limit);
    }

    // Assignment Reports
    @Get('assignment-submission-status')
    async getAssignmentSubmissionStatus(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('assignment_id') assignment_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.assignmentReports.getAssignmentSubmissionStatus(branch_id, class_id, section_id, assignment_id, page, limit);
    }

    @Get('pending-assignments')
    async getPendingAssignments(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.assignmentReports.getPendingAssignments(branch_id, class_id, section_id, page, limit);
    }

    @Get('teacher-assignment-load')
    async getTeacherAssignmentLoad(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('start_date') start_date?: string,
        @Query('end_date') end_date?: string
    ) {
        return this.assignmentReports.getTeacherAssignmentLoad(branch_id, class_id, section_id, start_date, end_date);
    }

    // Hostel Reports
    @Get('hostel-occupancy-report')
    async getHostelOccupancyReport(
        @Query('branch_id') branch_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.hostelReports.getHostelOccupancyReport(branch_id, page, limit);
    }

    @Get('room-allocation-report')
    async getRoomAllocationReport(
        @Query('branch_id') branch_id: number,
        @Query('hostel_id') hostel_id: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.hostelReports.getRoomAllocationReport(branch_id, hostel_id, page, limit);
    }

    // Timetable Reports
    @Get('class-timetable-report')
    async getClassTimetableReport(
        @Query('branch_id') branch_id: number,
        @Query('class_id') class_id: number,
        @Query('section_id') section_id: number,
        @Query('academic_year') academic_year: string
    ) {
        return this.timetableReports.getClassTimetableReport(branch_id, class_id, section_id, academic_year);
    }

    @Get('teacher-timetable-report')
    async getTeacherTimetableReport(
        @Query('branch_id') branch_id: number,
        @Query('teacher_id') teacher_id: number,
        @Query('academic_year') academic_year: string
    ) {
        return this.timetableReports.getTeacherTimetableReport(branch_id, teacher_id, academic_year);
    }

    // Transport Reports
    @Get('transport-vehicle-details')
    async getVehicleDetailsReport(
        @Query('branch_id') branch_id?: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.transportReports.getVehicleDetailsReport(branch_id, page, limit);
    }

    @Get('transport-route-student-count')
    async getRouteStudentCountReport(
        @Query('branch_id') branch_id?: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.transportReports.getRouteStudentCountReport(branch_id, page, limit);
    }

    @Get('transport-summary')
    async getTransportSummaryReport(
        @Query('branch_id') branch_id?: number
    ) {
        return this.transportReports.getTransportSummaryReport(branch_id);
    }
}

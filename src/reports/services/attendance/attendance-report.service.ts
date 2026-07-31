import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AttendanceService {
    constructor(private dataSource: DataSource) { }

    async getTeacherAttendance(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('Branch id is required');
        }

        const params: any[] = [branch_id];
        let idx = 2; // $1 is branch_id

        let query = `
            SELECT 
            a.id,
            b.branch_name,
            a.teacher_id,
            CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
            a.date,
            a.attendance_status,
            CASE 
                WHEN a.attendance_status = 0 THEN 'Absent'
                WHEN a.attendance_status = 1 THEN 'Present'
                WHEN a.attendance_status = 2 THEN 'Late'
                ELSE 'Unknown'
            END AS status_text,
            a.check_in,
            a.check_out
            FROM teacher_attendance a
            INNER JOIN teachers t ON t.teacher_id = a.teacher_id AND t.status = 1
            INNER JOIN branches b ON b.branch_id = a.branch_id AND b.status = 1
            WHERE a.branch_id = $1 
            AND a.status = 1
        `;

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM teacher_attendance a
            INNER JOIN teachers t ON t.teacher_id = a.teacher_id AND t.status = 1
            INNER JOIN branches b ON b.branch_id = a.branch_id AND b.status = 1
            WHERE a.branch_id = $1 
            AND a.status = 1
        `;

        const countResult = await this.dataSource.query(countQuery, [branch_id]);
        const totalRecords = parseInt(countResult[0]?.total || '0', 10);

        query += ` ORDER BY a.date DESC, a.id DESC`;

        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            query += ` LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(pageLimit, offset);
        }

        const result = await this.dataSource.query(query, params);

        return {
            status: true,
            message: 'Teacher attendance fetched successfully',
            data: result.map((row: any) => ({
                id: row.id,
                branch_name: row.branch_name,
                teacher_id: row.teacher_id,
                teacher_name: row.teacher_name,
                date: row.date,
                attendance_status: parseInt(row.attendance_status),
                status_text: row.status_text,
                check_in: row.check_in,
                check_out: row.check_out,
            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getStudentAttendance(branch_id: number, class_id?: number, section_id?: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('Branch id is required');
        }

        const params: any[] = [branch_id];
        let idx = 2;
        let conditions = `WHERE a.branch_id = $1 AND a.status = 1`;

        if (class_id) {
            conditions += ` AND a.class_id = $${idx++}`;
            params.push(class_id);
        }
        if (section_id) {
            conditions += ` AND a.section_id = $${idx++}`;
            params.push(section_id);
        }

        let query = `
            SELECT 
                a.id,
                b.branch_name,
                c.class_name,
                sec.section_name,
                a.student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                a.date,
                a.attendance_status,
                CASE 
                    WHEN a.attendance_status = 0 THEN 'Absent'
                    WHEN a.attendance_status = 1 THEN 'Present'
                    WHEN a.attendance_status = 2 THEN 'Late'
                    ELSE 'Unknown'
                END AS status_text
            FROM student_attendance a
            INNER JOIN students s ON s.student_id = a.student_id AND s.status = 1
            INNER JOIN branches b ON b.branch_id = a.branch_id AND b.status = 1
            INNER JOIN classes c ON c.class_id = a.class_id AND c.status = 1
            INNER JOIN sections sec ON sec.section_id = a.section_id
            ${conditions}
        `;

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM student_attendance a
            INNER JOIN students s ON s.student_id = a.student_id AND s.status = 1
            INNER JOIN branches b ON b.branch_id = a.branch_id AND b.status = 1
            INNER JOIN classes c ON c.class_id = a.class_id AND c.status = 1
            INNER JOIN sections sec ON sec.section_id = a.section_id
            ${conditions}
        `;

        const countResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(countResult[0]?.total || '0', 10);

        query += ` ORDER BY a.date DESC, a.id ASC`;

        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            query += ` LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(pageLimit, offset);
        }

        const result = await this.dataSource.query(query, params);

        return {
            status: true,
            message: 'Student attendance fetched successfully',
            data: result.map((row: any) => ({
                id: row.id,
                branch_name: row.branch_name,
                class_name: row.class_name,
                section_name: row.section_name,
                student_id: row.student_id,
                student_name: row.student_name,
                date: row.date,
                attendance_status: parseInt(row.attendance_status),
                status_text: row.status_text,
            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getStudentDailyAttendanceSummary(branch_id: number, class_id: number, section_id: number, date?: string) {
        if (!branch_id || !class_id || !section_id) {
            throw new BadRequestException('branch_id, class_id, and section_id are required');
        }
        const targetDate = date ?? new Date().toISOString().split('T')[0];

        if (targetDate > new Date().toISOString().split('T')[0]) {
            throw new BadRequestException('Date cannot be in the future');
        }

        const query = `
            SELECT 
                b.branch_name,
                COALESCE(COUNT(CASE WHEN sa.attendance_status = 1 THEN 1 END), 0) as present_count,
                COALESCE(COUNT(CASE WHEN sa.attendance_status = 0 THEN 1 END), 0) as absent_count,
                COALESCE(COUNT(CASE WHEN sa.attendance_status = 2 THEN 1 END), 0) as late_count,
                COALESCE(COUNT(sa.id), 0) as total_marked
            FROM branches b
            LEFT JOIN student_attendance sa 
                ON b.branch_id = sa.branch_id 
                AND sa.class_id = $2 
                AND sa.section_id = $3 
                AND sa.date = $4 
                AND sa.status = 1
            WHERE b.branch_id = $1 AND b.status = 1
            GROUP BY b.branch_name
        `;

        const result = await this.dataSource.query(query, [branch_id, class_id, section_id, targetDate]);
        const data = result[0] || {};

        return {
            status: true,
            message: 'Student daily attendance summary fetched successfully',
            data: {
                branch_name: data.branch_name || '',
                present_count: parseInt(data.present_count || 0),
                absent_count: parseInt(data.absent_count || 0),
                late_count: parseInt(data.late_count || 0),
                total_marked: parseInt(data.total_marked || 0)
            }
        };
    }

    async getStudentDailyAttendanceList(branch_id: number, class_id: number, section_id: number, date?: string) {
        if (!branch_id || !class_id || !section_id) {
            throw new BadRequestException('branch_id, class_id, and section_id are required');
        }
        const targetDate = date || new Date().toISOString().split('T')[0];

        if (targetDate > new Date().toISOString().split('T')[0]) {
            throw new BadRequestException('Date cannot be in the future');
        }

        const query = `
            SELECT 
                b.branch_name,
                c.class_name,
                sec.section_name,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.roll_number,
                CASE 
                    WHEN sa.attendance_status = 1 THEN 'Present'
                    WHEN sa.attendance_status = 0 THEN 'Absent'
                    WHEN sa.attendance_status = 2 THEN 'Late'
                    ELSE 'Not Marked'
                END as status
            FROM students s
            JOIN branches b ON s.branch_id = b.branch_id
            JOIN classes c ON s.class_id = c.class_id
            JOIN sections sec ON s.section_id = sec.section_id
            LEFT JOIN student_attendance sa ON s.student_id = sa.student_id AND sa.date = $1 AND sa.status = 1
            WHERE s.status = 1 AND s.branch_id = $2 AND s.class_id = $3 AND s.section_id = $4
            ORDER BY s.roll_number ASC
        `;

        const result = await this.dataSource.query(query, [targetDate, branch_id, class_id, section_id]);

        return {
            status: true,
            message: 'Student daily attendance list fetched successfully',
            data: result
        };
    }

    async getStudentMonthlyAttendanceSummary(branch_id: number, class_id: number, section_id: number, month: number, year: number) {
        if (!branch_id || !class_id || !section_id || !month || !year) {
            throw new BadRequestException('branch_id, class_id, section_id, month, and year are required');
        }
        if (year > new Date().getFullYear()) {
            throw new BadRequestException('Year cannot be in the future');
        }


        const query = `
            SELECT 
                s.student_id,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.roll_number,
                COUNT(CASE WHEN sa.attendance_status = 1 THEN 1 END) as present_days,
                COUNT(CASE WHEN sa.attendance_status = 0 THEN 1 END) as absent_days,
                COUNT(CASE WHEN sa.attendance_status = 2 THEN 1 END) as late_days,
                COUNT(sa.id) as total_days_marked,
                ROUND(((COUNT(CASE WHEN sa.attendance_status IN (1, 2) THEN 1 END)::float / NULLIF(COUNT(sa.id), 0)) * 100)::numeric, 2) as attendance_percentage
            FROM students s
            LEFT JOIN student_attendance sa ON s.student_id = sa.student_id 
                AND EXTRACT(MONTH FROM sa.date) = $4 
                AND EXTRACT(YEAR FROM sa.date) = $5
                AND sa.status = 1
            WHERE s.branch_id = $1 AND s.class_id = $2 AND s.section_id = $3 AND s.status = 1
            GROUP BY s.student_id, s.first_name, s.last_name, s.roll_number
            ORDER BY s.roll_number ASC
        `;

        const result = await this.dataSource.query(query, [branch_id, class_id, section_id, month, year]);

        return {
            status: true,
            message: 'Student monthly attendance summary fetched successfully',
            data: result.map(r => ({
                ...r,
                present_days: parseInt(r.present_days),
                absent_days: parseInt(r.absent_days),
                late_days: parseInt(r.late_days),
                total_days_marked: parseInt(r.total_days_marked),
                attendance_percentage: parseFloat(r.attendance_percentage || 0)
            }))
        };
    }

    async getTeacherDailyAttendanceSummary(date?: string, branch_id?: number) {
        const targetDate = date || new Date().toISOString().split('T')[0];

        if (targetDate > new Date().toISOString().split('T')[0]) {
            throw new BadRequestException('Date cannot be in the future');
        }

        const params: any[] = [targetDate];
        let branchFilter = '';
        if (branch_id) {
            branchFilter = ` AND b.branch_id = $2`;
            params.push(branch_id);
        }

        const query = `
            SELECT 
                b.branch_id,
                b.branch_name,
                COALESCE(SUM(CASE WHEN ta.attendance_status = 1 THEN 1 ELSE 0 END), 0) as present_count,
                COALESCE(SUM(CASE WHEN ta.attendance_status = 0 THEN 1 ELSE 0 END), 0) as absent_count,
                COALESCE(SUM(CASE WHEN ta.attendance_status = 2 THEN 1 ELSE 0 END), 0) as late_count,
                COALESCE(COUNT(ta.id), 0) as total_marked,
                (
                    SELECT COUNT(*) 
                    FROM teacher_leave tl 
                    WHERE tl.branch_id = b.branch_id 
                    AND $1 BETWEEN tl.from_date AND tl.to_date 
                    AND tl.leave_status = 'approved' 
                    AND tl.status = 1
                ) as leave_count
            FROM branches b
            LEFT JOIN teacher_attendance ta ON b.branch_id = ta.branch_id AND ta.date = $1 AND ta.status = 1
            WHERE b.status = 1 ${branchFilter}
            GROUP BY b.branch_id, b.branch_name
            ORDER BY b.branch_id ASC
        `;

        const result = await this.dataSource.query(query, params);

        return {
            status: true,
            message: 'Teacher daily attendance summary fetched successfully',
            data: result.map(r => ({
                branch_id: r.branch_id,
                branch_name: r.branch_name,
                present_count: parseInt(r.present_count || 0),
                absent_count: parseInt(r.absent_count || 0),
                late_count: parseInt(r.late_count || 0),
                leave_count: parseInt(r.leave_count || 0),
                total_marked: parseInt(r.total_marked || 0)
            }))
        };
    }

    async getTeacherDailyAttendanceList(date?: string, branch_id?: number) {
        const targetDate = date || new Date().toISOString().split('T')[0];

        if (targetDate > new Date().toISOString().split('T')[0]) {
            throw new BadRequestException('Date cannot be in the future');
        }

        const params: any[] = [targetDate];
        let branchFilter = '';
        if (branch_id) {
            branchFilter = ` AND t.branch_id = $2`;
            params.push(branch_id);
        }

        const query = `
            SELECT 
                b.branch_name,
                CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                CASE 
                    WHEN tl.leave_id IS NOT NULL THEN 'Leave'
                    WHEN ta.attendance_status = 1 THEN 'Present'
                    WHEN ta.attendance_status = 0 THEN 'Absent'
                    WHEN ta.attendance_status = 2 THEN 'Late'
                    ELSE 'Not Marked'
                END as status
            FROM teachers t
            JOIN branches b ON t.branch_id = b.branch_id
            LEFT JOIN teacher_attendance ta ON t.teacher_id = ta.teacher_id AND ta.date = $1 AND ta.status = 1
            LEFT JOIN teacher_leave tl ON t.teacher_id = tl.teacher_id 
                AND $1 BETWEEN tl.from_date AND tl.to_date 
                AND tl.leave_status = 'approved' AND tl.status = 1
            WHERE t.status = 1 ${branchFilter}
            ORDER BY b.branch_id ASC, t.first_name ASC
        `;

        const result = await this.dataSource.query(query, params);

        return {
            status: true,
            message: 'Teacher daily attendance list fetched successfully',
            data: result
        };
    }


    async getTeacherMonthlyAttendanceSummary(branch_id: number, month: number, year: number) {
        if (!branch_id || !month || !year) {
            throw new BadRequestException('branch_id, month, and year are required');
        }

        if (year > new Date().getFullYear()) {
            throw new BadRequestException('Year cannot be in the future');
        }

        const query = `
            SELECT 
                t.teacher_id,
                CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                COUNT(CASE WHEN ta.attendance_status = 1 THEN 1 END) as present_days,
                COUNT(CASE WHEN ta.attendance_status = 0 THEN 1 END) as absent_days,
                COUNT(CASE WHEN ta.attendance_status = 2 THEN 1 END) as late_days,
                COUNT(ta.id) as total_days_marked,
                (
                    SELECT COUNT(*) 
                    FROM teacher_leave tl 
                    WHERE tl.teacher_id = t.teacher_id 
                    AND tl.leave_status = 'approved' 
                    AND tl.status = 1
                    AND (
                        (EXTRACT(MONTH FROM tl.from_date) = $2 AND EXTRACT(YEAR FROM tl.from_date) = $3)
                        OR
                        (EXTRACT(MONTH FROM tl.to_date) = $2 AND EXTRACT(YEAR FROM tl.to_date) = $3)
                    )
                ) as leave_count,
                ROUND(((COUNT(CASE WHEN ta.attendance_status IN (1, 2) THEN 1 END)::float / NULLIF(COUNT(ta.id), 0)) * 100)::numeric, 2) as attendance_percentage
            FROM teachers t
            LEFT JOIN teacher_attendance ta ON t.teacher_id = ta.teacher_id 
                AND EXTRACT(MONTH FROM ta.date) = $2 
                AND EXTRACT(YEAR FROM ta.date) = $3
                AND ta.status = 1
            WHERE t.branch_id = $1 AND t.status = 1
            GROUP BY t.teacher_id, t.first_name, t.last_name
            ORDER BY t.first_name ASC
        `;

        const result = await this.dataSource.query(query, [branch_id, month, year]);

        return {
            status: true,
            message: 'Teacher monthly attendance summary fetched successfully',
            data: result.map(r => ({
                ...r,
                present_days: parseInt(r.present_days),
                absent_days: parseInt(r.absent_days),
                late_days: parseInt(r.late_days),
                leave_count: parseInt(r.leave_count),
                total_days_marked: parseInt(r.total_days_marked),
                attendance_percentage: parseFloat(r.attendance_percentage || 0)
            }))
        };
    }
}
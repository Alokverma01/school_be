
import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AssignmentReportService {
    constructor(private dataSource: DataSource) { }

    // 1. Submission Status: For a specific assignment, who submitted and who didn't
    async getAssignmentSubmissionStatus(
        branch_id: number,
        class_id: number,
        section_id: number,
        assignment_id: number,
        page?: number,
        limit?: number
    ) {
        if (!branch_id || !class_id || !section_id || !assignment_id) {
            throw new BadRequestException('branch_id, class_id, section_id, and assignment_id are required');
        }

        const params: any[] = [branch_id, class_id, section_id, assignment_id];
        let idx = 5;

        // Base query: All students in the section LEFT JOIN submissions for this assignment
        let query = `
            SELECT 
                b.branch_name,
                c.class_name,
                sec.section_name,
                s.student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.roll_number,
                CASE 
                    WHEN sub.submission_id IS NOT NULL THEN 'Submitted' 
                    ELSE 'Pending' 
                END AS submission_status,
                sub.created_at as submission_date,
                sub.marks,
                sub.remarks
            FROM students s
            LEFT JOIN branches b ON b.branch_id = s.branch_id
            LEFT JOIN classes c ON c.class_id = s.class_id
            LEFT JOIN sections sec ON sec.section_id = s.section_id
            LEFT JOIN assignment_submissions sub 
                ON s.student_id = sub.student_id 
                AND sub.assignment_id = $4 
                AND sub.status = 1
            WHERE s.branch_id = $1 
              AND s.class_id = $2 
              AND s.section_id = $3 
              AND s.status = 1
            ORDER BY s.roll_number ASC
        `;

        if (page && limit) {
            const offset = (page - 1) * limit;
            query += ` LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(query, params);

        const countQuery = `
            SELECT COUNT(*) as total
            FROM students s
            WHERE s.branch_id = $1 
              AND s.class_id = $2 
              AND s.section_id = $3 
              AND s.status = 1
        `;
        const totalResult = await this.dataSource.query(countQuery, [branch_id, class_id, section_id]);
        const totalRecords = parseInt(totalResult[0]?.total || '0', 10);

        return {
            status: true,
            message: 'Assignment submission status fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1
        };
    }

    // 2. Pending Assignments: List of all assignments that are pending for students in a class
    async getPendingAssignments(
        branch_id: number,
        class_id: number,
        section_id: number,
        page?: number,
        limit?: number
    ) {
        if (!branch_id || !class_id || !section_id) {
            throw new BadRequestException('branch_id, class_id, and section_id are required');
        }

        const params: any[] = [branch_id, class_id, section_id];
        let idx = 4;

        let query = `
            SELECT 
                b.branch_name,
                c.class_name,
                sec.section_name,
                s.student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.roll_number,
                a.assignment_id,
                a.title AS assignment_title,
                a.due_date,
                ms.subject_name
            FROM students s
            LEFT JOIN branches b ON b.branch_id = s.branch_id
            LEFT JOIN classes c ON c.class_id = s.class_id
            LEFT JOIN sections sec ON sec.section_id = s.section_id
            JOIN assignments a ON a.branch_id = s.branch_id 
                AND a.class_id = s.class_id 
                AND a.section_id = s.section_id
                AND a.status = 1
            LEFT JOIN subjects sub ON sub.id = a.subject_id
            LEFT JOIN master_subjects ms ON ms.id = sub.master_subject_id
            LEFT JOIN assignment_submissions subs ON subs.assignment_id = a.assignment_id 
                AND subs.student_id = s.student_id 
                AND subs.status = 1
            WHERE s.branch_id = $1 
              AND s.class_id = $2 
              AND s.section_id = $3
              AND s.status = 1
              AND subs.submission_id IS NULL -- Only where NO submission exists
              AND a.due_date < NOW() -- Optionally only show overdue? Or all pending? User said "Pending". 
                                     -- Usually pending means "not submitted yet", could include future ones. 
                                     -- But often implies "work that needs doing". Let's show all.
            ORDER BY a.due_date ASC, s.roll_number ASC
        `;

        // Note: The above query generates a row for EVERY missing assignment for EVERY student. 
        // This could be large. Pagination is important.

        if (page && limit) {
            const offset = (page - 1) * limit;
            query += ` LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(query, params);

        // We need a separate count query for pagination which is complex here.
        // Simplified count:
        const countQuery = `
            SELECT COUNT(*) as total
            FROM students s
            JOIN assignments a ON a.branch_id = s.branch_id 
                AND a.class_id = s.class_id 
                AND a.section_id = s.section_id
                AND a.status = 1
            LEFT JOIN assignment_submissions subs ON subs.assignment_id = a.assignment_id 
                AND subs.student_id = s.student_id 
                AND subs.status = 1
            WHERE s.branch_id = $1 
              AND s.class_id = $2 
              AND s.section_id = $3
              AND s.status = 1
              AND subs.submission_id IS NULL
        `;

        const totalResult = await this.dataSource.query(countQuery, [branch_id, class_id, section_id]);
        const totalRecords = parseInt(totalResult[0]?.total || '0', 10);

        return {
            status: true,
            message: 'Pending assignments report fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1
        };
    }

    // 3. Teacher-wise Assignment Load
    async getTeacherAssignmentLoad(
        branch_id: number,
        class_id: number,
        section_id: number,
        startDate?: string,
        endDate?: string
    ) {
        if (!branch_id || !class_id || !section_id) {
            throw new BadRequestException('branch_id, class_id, and section_id are required');
        }

        let query = `
            SELECT 
                b.branch_name,
                c.class_name,
                sec.section_name,
                t.teacher_id,
                CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
                a.assignment_id,
                a.title AS assignment_title,
                a.due_date,
                ms.subject_name
            FROM assignments a
            LEFT JOIN branches b ON b.branch_id = a.branch_id
            LEFT JOIN classes c ON c.class_id = a.class_id
            LEFT JOIN sections sec ON sec.section_id = a.section_id
            LEFT JOIN teachers t ON a.teacher_id = t.teacher_id
            LEFT JOIN subjects s ON s.id = a.subject_id
            LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
            WHERE a.branch_id = $1 
              AND a.class_id = $2 
              AND a.section_id = $3
              AND a.status = 1
        `;

        const params: any[] = [branch_id, class_id, section_id];
        let idx = 4;

        if (startDate) {
            query += ` AND a.created_at >= $${idx++}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND a.created_at <= $${idx++}`;
            params.push(endDate);
        }

        query += ` ORDER BY a.due_date DESC`;

        const result = await this.dataSource.query(query, params);

        return {
            status: true,
            message: 'Teacher assignment load fetched successfully',
            data: result
        };
    }
}

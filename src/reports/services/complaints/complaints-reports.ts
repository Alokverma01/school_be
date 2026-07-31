import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ComplaintsReportService {
    constructor(private readonly dataSource: DataSource) { }

    async getComplaintsList(
        branch_id?: number,
        status?: string,
        page?: number,
        limit?: number
    ) {
        const params: any[] = [];
        let conditions = 'WHERE c.status = 1';
        let idx = 1;

        if (branch_id) {
            conditions += ` AND c.branch_id = $${idx++}`;
            params.push(branch_id);
        }

        if (status) {
            conditions += ` AND c.complaint_status = $${idx++}`;
            params.push(status);
        }

        const query = `
            SELECT 
                c.complaint_id,
                b.branch_name,
                c.raised_by,
                CASE 
                    WHEN c.raised_by = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                    WHEN c.raised_by = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
                END as raised_by_name,
                c.complaint_type as against_type,
                CASE 
                    WHEN c.complaint_type = 'student' THEN CONCAT(s2.first_name, ' ', s2.last_name)
                    WHEN c.complaint_type = 'teacher' THEN CONCAT(t2.first_name, ' ', t2.last_name)
                END as against_name,
                c.priority,
                c.message,
                c.complaint_status,
                c.resolution_note,
                c.created_at
            FROM complaints c
            LEFT JOIN branches b ON c.branch_id = b.branch_id
            LEFT JOIN students s ON c.raised_by = 'student' AND c.raised_by_id = s.student_id
            LEFT JOIN teachers t ON c.raised_by = 'teacher' AND c.raised_by_id = t.teacher_id
            LEFT JOIN students s2 ON c.complaint_type = 'student' AND c.against_id = s2.student_id
            LEFT JOIN teachers t2 ON c.complaint_type = 'teacher' AND c.against_id = t2.teacher_id
            ${conditions}
            ORDER BY c.created_at DESC
        `;

        // Total count for pagination
        const countQuery = `SELECT COUNT(*) FROM (${query}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        let finalQuery = query;
        if (page && limit) {
            const offset = (page - 1) * limit;
            finalQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(finalQuery, params);

        return {
            status: true,
            message: 'Complaints list fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

}

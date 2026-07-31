import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CertificateReportService {
    constructor(private readonly dataSource: DataSource) { }

    async getCertificatesList(
        branch_id: number,
        issued_to?: string,
        class_id?: number,
        section_id?: number,
        page?: number,
        limit?: number
    ) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];
        let conditions = 'WHERE c.branch_id = $1 AND c.status = 1';
        let idx = 2;

        if (issued_to) {
            conditions += ` AND c.issued_to = $${idx++}`;
            params.push(issued_to);
        }
        if (class_id) {
            conditions += ` AND c.class_id = $${idx++}`;
            params.push(class_id);
        }
        if (section_id) {
            conditions += ` AND c.section_id = $${idx++}`;
            params.push(section_id);
        }

        const query = `
            SELECT 
                b.branch_name,
                c.certificate_id,
                c.issued_to,
                c.certificate_type_id,
                ct.certificate_name,
                c.issue_date,
                c.notes,
                CASE 
                    WHEN c.issued_to = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                    WHEN c.issued_to = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
                    ELSE 'School'
                END as recipient_name,
                CASE 
                    WHEN c.issued_to = 'student' THEN s.roll_number
                    ELSE NULL
                END as roll_number,
                cl.class_name,
                sec.section_name
            FROM certificates c
            LEFT JOIN branches b ON c.branch_id = b.branch_id
            LEFT JOIN students s ON c.issued_to = 'student' AND c.user_id = s.student_id
            LEFT JOIN teachers t ON c.issued_to = 'teacher' AND c.user_id = t.teacher_id
            LEFT JOIN classes cl ON c.class_id = cl.class_id
            LEFT JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.certificate_type_id
            ${conditions}
            ORDER BY c.issue_date DESC
        `;

        // Total count
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
            message: 'Certificates list fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async searchCertificates(
        branch_id: number,
        keyword: string,
        issued_to: string,
        page?: number,
        limit?: number
    ) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }
        if (!keyword?.trim()) {
            throw new BadRequestException('keyword is required');
        }

        const search = `%${keyword.trim()}%`;
        const params: any[] = [branch_id, search];
        let idx = 3;

        let conditions = 'WHERE c.branch_id = $1 AND c.status = 1';
        if (issued_to) {
            conditions += ` AND c.issued_to = $${idx++}`;
            params.push(issued_to);
        }

        const query = `
            SELECT 
                b.branch_name,
                c.certificate_id,
                c.issued_to,
                c.certificate_type_id,
                ct.certificate_name,
                c.issue_date,
                c.notes,
                CASE 
                    WHEN c.issued_to = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                    WHEN c.issued_to = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
                    ELSE 'School'
                END as recipient_name,
                CASE 
                    WHEN c.issued_to = 'student' THEN s.roll_number
                    ELSE NULL
                END as roll_number,
                cl.class_name,
                sec.section_name
            FROM certificates c
            LEFT JOIN branches b ON c.branch_id = b.branch_id
            LEFT JOIN students s ON c.issued_to = 'student' AND c.user_id = s.student_id
            LEFT JOIN teachers t ON c.issued_to = 'teacher' AND c.user_id = t.teacher_id
            LEFT JOIN classes cl ON c.class_id = cl.class_id
            LEFT JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.certificate_type_id
            ${conditions}
            AND (
                
                ct.certificate_name::text ILIKE $2
                OR c.notes::text ILIKE $2
                OR (c.issued_to = 'student' AND (CONCAT(s.first_name, ' ', s.last_name) ILIKE $2 OR s.roll_number::text ILIKE $2))
                OR (c.issued_to = 'teacher' AND CONCAT(t.first_name, ' ', t.last_name) ILIKE $2)
                OR cl.class_name::text ILIKE $2
                OR sec.section_name::text ILIKE $2
            )
            ORDER BY c.issue_date DESC
        `;

        // Total count
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
            message: 'Certificates search results fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }
}

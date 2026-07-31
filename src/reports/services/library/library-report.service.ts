import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class LibraryReportsService {
    constructor(private readonly dataSource: DataSource) { }

    async getIssueReturnReport(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) throw new BadRequestException('branch_id is required');

        const params: any[] = [branch_id];

        let baseQuery = `
            SELECT
                bi.issue_id,
                bi.issued_to,
                bi.issued_date,
                bi.return_date,
                bi.fine_amount,
                bi.issue_status,
                b.title as book_title,
                b.isbn,
                br.branch_name,
                CASE 
                    WHEN bi.issued_to = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                    WHEN bi.issued_to = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
                END as issued_to_name
            FROM book_issue bi
            INNER JOIN books b ON b.book_id = bi.book_id
            INNER JOIN branches br ON br.branch_id = bi.branch_id
            LEFT JOIN students s ON bi.issued_to = 'student' AND s.student_id = bi.issued_to_id
            LEFT JOIN teachers t ON bi.issued_to = 'teacher' AND t.teacher_id = bi.issued_to_id
            WHERE bi.branch_id = $1 AND bi.status != 0
        `;

        baseQuery += ` ORDER BY bi.issued_date DESC`;

        // Total count
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        // Pagination
        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $2 OFFSET $3`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        return {
            status: true,
            message: 'Book issue-return report fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async getPopularBooks(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) throw new BadRequestException('branch_id is required');

        const params: any[] = [branch_id];

        let baseQuery = `
            SELECT 
                br.branch_name,
                b.book_id,
                b.title,
                b.author,
                b.category,
                COUNT(bi.issue_id) as issue_count
            FROM books b
            LEFT JOIN book_issue bi ON bi.book_id = b.book_id AND bi.status != 0
            INNER JOIN branches br ON br.branch_id = b.branch_id
            WHERE b.branch_id = $1 AND b.status = 1
            GROUP BY br.branch_name, b.book_id, b.title, b.author, b.category
        `;

        baseQuery += ` ORDER BY issue_count DESC`;

        // Total count
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        // Pagination
        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $2 OFFSET $3`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        return {
            status: true,
            message: 'Popular books report fetched successfully',
            data: result.map(r => ({
                ...r,
                issue_count: parseInt(r.issue_count)

            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getOverdueBooks(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) throw new BadRequestException('branch_id is required');

        const params: any[] = [branch_id];

        let baseQuery = `
            SELECT 
                bi.issue_id,
                bi.issued_to,
                bi.issued_date,
                bi.return_date,
                bi.fine_amount,
                bi.issue_status,
                b.title as book_title,
                b.isbn,
                br.branch_name,
                CASE 
                    WHEN bi.issued_to = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                    WHEN bi.issued_to = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
                END as issued_to_name,
                (CURRENT_DATE - bi.return_date::date) as days_overdue,
                ((CURRENT_DATE - bi.return_date::date) * bi.fine_amount) as total_fine
            FROM book_issue bi  
            INNER JOIN books b ON b.book_id = bi.book_id
            INNER JOIN branches br ON br.branch_id = bi.branch_id
            LEFT JOIN students s ON bi.issued_to = 'student' AND s.student_id = bi.issued_to_id
            LEFT JOIN teachers t ON bi.issued_to = 'teacher' AND t.teacher_id = bi.issued_to_id
            WHERE bi.branch_id = $1 
            AND bi.status = 1 
            AND bi.issue_status = 'issued'
            AND bi.return_date < CURRENT_DATE
        `;

        baseQuery += ` ORDER BY days_overdue DESC`;

        // Total count
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        // Pagination
        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $2 OFFSET $3`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        return {
            status: true,
            message: 'Overdue books report fetched successfully',
            data: result.map(r => ({
                ...r,
                days_overdue: parseInt(r.days_overdue),
                total_fine: parseFloat(r.total_fine || 0)
            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }
}

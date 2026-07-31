
import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class FeesReportService {
    constructor(private dataSource: DataSource) { }

    async getFeesCollectionReport(
        branch_id: number,
        class_id: number,
        section_id: number,
        month?: number,
        year?: number,
        page?: number,
        limit?: number
    ) {
        if (!branch_id || !class_id || !section_id) {
            throw new BadRequestException('branch_id, class_id, and section_id are required');
        }

        const currentDate = new Date();
        const targetMonth = month || (currentDate.getMonth() + 1);
        const targetYear = year || currentDate.getFullYear();

        const params: any[] = [branch_id, class_id, section_id, targetMonth, targetYear];
        let idx = 6;

        let query = `
            SELECT
            b.branch_name,
            c.class_name,
            sec.section_name,
            s.student_id,
            CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.roll_number,
                COALESCE(payment_data.total_paid, 0) AS total_paid,
                    CASE 
                    WHEN payment_data.payment_count > 0 THEN 'Paid' 
                    ELSE 'Not Paid' 
                END AS status
            FROM students s
            LEFT JOIN branches b ON s.branch_id = b.branch_id
            LEFT JOIN classes c ON s.class_id = c.class_id
            LEFT JOIN sections sec ON s.section_id = sec.section_id
            LEFT JOIN(
                        SELECT 
                    fp.student_id,
                        SUM(fpd.amount_paid) as total_paid,
                        COUNT(DISTINCT fp.id) as payment_count
                FROM fee_payments fp
                JOIN fee_payment_details fpd ON fp.id = fpd.fee_payment_id AND fpd.status = 1
                WHERE fp.status = 1 
                  AND EXTRACT(MONTH FROM fp.payment_date) = $4 
                  AND EXTRACT(YEAR FROM fp.payment_date) = $5
                GROUP BY fp.student_id
                    ) payment_data ON s.student_id = payment_data.student_id
            WHERE s.branch_id = $1 
              AND s.class_id = $2 
              AND s.section_id = $3 
              AND s.status = 1
            ORDER BY s.roll_number ASC
            `;

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

        if (page && limit) {
            const offset = (page - 1) * limit;
            query += ` LIMIT $${idx++} OFFSET $${idx++} `;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(query, params);

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[targetMonth - 1];

        return {
            status: true,
            message: 'Fees collection report fetched successfully',
            data: result.map(r => ({
                student_id: r.student_id,
                branch_name: r.branch_name,
                class_name: r.class_name,
                section_name: r.section_name,
                student_name: r.student_name,
                roll_number: r.roll_number,
                total_paid: parseFloat(r.total_paid),
                status: r.status,
                month: targetMonth,
                month_name: monthName,
                year: targetYear
            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1
        };
    }

    async searchFeesCollectionReport(
        keyword: string,
        branch_id: number,
        class_id: number,
        section_id: number,
        month?: number,
        year?: number,
        page?: number,
        limit?: number
    ) {
        if (!branch_id || !class_id || !section_id) {
            throw new BadRequestException('branch_id, class_id, and section_id are required');
        }

        const currentDate = new Date();
        const targetMonth = month || (currentDate.getMonth() + 1);
        const targetYear = year || currentDate.getFullYear();
        const searchTerm = `%${keyword.trim()}%`;

        const params: any[] = [branch_id, class_id, section_id, targetMonth, targetYear, searchTerm];
        let idx = 7; // $1..$5 are base filters, $6 is search term

        let query = `
            SELECT
                b.branch_name,
                c.class_name,
                sec.section_name,
                s.student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.roll_number,
                COALESCE(payment_data.total_paid, 0) AS total_paid,
                CASE 
                    WHEN payment_data.payment_count > 0 THEN 'Paid' 
                    ELSE 'Not Paid' 
                END AS status
            FROM students s
            LEFT JOIN branches b ON s.branch_id = b.branch_id
            LEFT JOIN classes c ON s.class_id = c.class_id
            LEFT JOIN sections sec ON s.section_id = sec.section_id
            LEFT JOIN (
                SELECT 
                    fp.student_id,
                    SUM(fpd.amount_paid) as total_paid,
                    COUNT(DISTINCT fp.id) as payment_count
                FROM fee_payments fp
                JOIN fee_payment_details fpd ON fp.id = fpd.fee_payment_id AND fpd.status = 1
                WHERE fp.status = 1 
                  AND EXTRACT(MONTH FROM fp.payment_date) = $4 
                  AND EXTRACT(YEAR FROM fp.payment_date) = $5
                GROUP BY fp.student_id
            ) payment_data ON s.student_id = payment_data.student_id
            WHERE s.branch_id = $1 
              AND s.class_id = $2 
              AND s.section_id = $3 
              AND s.status = 1
              AND (
                  s.first_name ILIKE $6 OR 
                  s.last_name ILIKE $6 OR 
                  CONCAT(s.first_name, ' ', s.last_name) ILIKE $6
              )
            ORDER BY s.roll_number ASC
        `;

        const countQuery = `
             SELECT COUNT(*) as total
             FROM students s
             WHERE s.branch_id = $1 
               AND s.class_id = $2 
               AND s.section_id = $3 
               AND s.status = 1
               AND (
                  s.first_name ILIKE $4 OR 
                  s.last_name ILIKE $4 OR 
                  CONCAT(s.first_name, ' ', s.last_name) ILIKE $4 OR
                  CAST(s.roll_number AS TEXT) ILIKE $4
              )
        `;

        const countParams = [branch_id, class_id, section_id, searchTerm];
        const totalResult = await this.dataSource.query(countQuery, countParams);
        const totalRecords = parseInt(totalResult[0]?.total || '0', 10);

        if (page && limit) {
            const offset = (page - 1) * limit;
            query += ` LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(query, params);

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[targetMonth - 1];

        return {
            status: true,
            message: 'Fees collection report search results fetched successfully',
            data: result.map(r => ({
                student_id: r.student_id,
                branch_name: r.branch_name,
                class_name: r.class_name,
                section_name: r.section_name,
                student_name: r.student_name,
                roll_number: r.roll_number,
                total_paid: parseFloat(r.total_paid),
                status: r.status,
                month: targetMonth,
                month_name: monthName,
                year: targetYear
            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1
        };
    }
}

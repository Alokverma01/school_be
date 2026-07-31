import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SalaryService {
    constructor(private readonly dataSource: DataSource) { }

    async getMonthlySalaryReport(branch_id: number, month: string, year: number, page?: number, limit?: number) {
        if (!branch_id) throw new BadRequestException('branch_id is required');
        if (!month) throw new BadRequestException('month is required');
        if (!year) throw new BadRequestException('year is required');

        if(year > new Date().getFullYear()) throw new BadRequestException('year should not be greater than current year');

        const params: any[] = [branch_id, month, year];

        let baseQuery = `
            SELECT 
                p.payroll_id,
                p.month,
                p.year,
                p.base_salary,
                p.deductions,
                p.incentives,
                p.net_salary,
                p.paid_status,
                p.payment_date,
                t.teacher_id,
                CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                b.branch_name
            FROM teacher_payroll p
            INNER JOIN teachers t ON t.teacher_id = p.teacher_id
            INNER JOIN branches b ON b.branch_id = p.branch_id
            WHERE p.branch_id = $1 AND p.month = $2 AND p.year = $3 AND p.status = 1
        `;

        baseQuery += ` ORDER BY t.first_name ASC`;

        // Total count
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        // Pagination
        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $4 OFFSET $5`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        return {
            status: true,
            message: 'Monthly salary report fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async searchSalaryReport(keyword: string, branch_id: number, month: string, year: number, page?: number, limit?: number) {
        if (!keyword?.trim()) throw new BadRequestException('keyword is required');
        if (!branch_id) throw new BadRequestException('branch_id is required');
        if (!month) throw new BadRequestException('month is required');
        if (!year) throw new BadRequestException('year is required');

        if(year > new Date().getFullYear()) throw new BadRequestException('year should not be greater than current year');


        const searchTerm = `%${keyword.trim()}%`;
        const params: any[] = [branch_id, month, year, searchTerm];

        let baseQuery = `
            SELECT 
                p.payroll_id,
                p.month,
                p.year,
                p.base_salary,
                p.deductions,
                p.incentives,
                p.net_salary,
                p.paid_status,
                p.payment_date,
                t.teacher_id,
                CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                b.branch_name
            FROM teacher_payroll p
            INNER JOIN teachers t ON t.teacher_id = p.teacher_id
            INNER JOIN branches b ON b.branch_id = p.branch_id
            WHERE p.branch_id = $1 AND p.month = $2 AND p.year = $3 AND p.status = 1
            AND (t.first_name ILIKE $4 OR t.last_name ILIKE $4)
        `;

        baseQuery += ` ORDER BY t.first_name ASC`;

        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $5 OFFSET $6`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        return {
            status: true,
            message: 'Salary report search completed',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async filterSalaryReport(filters: any, branch_id: number, month: string, year: number, page?: number, limit?: number) {
        if (!branch_id) throw new BadRequestException('branch_id is required');
        if (!month) throw new BadRequestException('month is required');
        if (!year) throw new BadRequestException('year is required');

        if(year > new Date().getFullYear()) throw new BadRequestException('year should not be greater than current year');

        let baseQuery = `
            SELECT 
                p.payroll_id,
                p.month,
                p.year,
                p.base_salary,
                p.deductions,
                p.incentives,
                p.net_salary,
                p.paid_status,
                p.payment_date,
                t.teacher_id,
                CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                b.branch_name
            FROM teacher_payroll p
            INNER JOIN teachers t ON t.teacher_id = p.teacher_id
            INNER JOIN branches b ON b.branch_id = p.branch_id
            WHERE p.branch_id = $1 AND p.month = $2 AND p.year = $3 AND p.status = 1
        `;

        const params: any[] = [branch_id, month, year];
        let paramIdx = 4;

        if (filters?.paid_status) {
            baseQuery += ` AND p.paid_status = $${paramIdx++}`;
            params.push(filters.paid_status);
        }

        if (filters?.min_salary) {
            baseQuery += ` AND p.net_salary >= $${paramIdx++}`;
            params.push(filters.min_salary);
        }

        if (filters?.max_salary) {
            baseQuery += ` AND p.net_salary <= $${paramIdx++}`;
            params.push(filters.max_salary);
        }

        baseQuery += ` ORDER BY t.first_name ASC`;

        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        return {
            status: true,
            message: 'Salary report filter applied successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }
}

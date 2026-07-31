

import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentsService {
    constructor(private readonly dataSource: DataSource) { }

    async getStudentList(branch_id: number, class_id: number, section_id: number, page?: number, limit?: number) {
        if (!branch_id) throw new BadRequestException('branch_id is required');
        if (!class_id) throw new BadRequestException('class_id is required');
        if (!section_id) throw new BadRequestException('section_id is required');

        const params: any[] = [branch_id, class_id, section_id];

        let baseQuery = `
            SELECT 
                std.student_id,
                std.first_name,
                std.last_name,
                std.dob,
                std.email,
                std.gender,
                std.student_aadhar,
                std.admission_number,
                std.roll_number,
                std.is_ews,
                std.address,
                c.class_name,
                s.section_name
            FROM students std
            INNER JOIN classes c ON std.class_id = c.class_id
            INNER JOIN sections s ON std.section_id = s.section_id
            WHERE std.branch_id = $1 AND std.class_id = $2 AND std.section_id = $3 AND std.status = 1
        `;

        baseQuery += ` ORDER BY std.roll_number ASC`;

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
            message: 'Student list fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async searchStudentList(keyword: string, branch_id: number, class_id: number, section_id: number, page?: number, limit?: number) {
        if (!keyword?.trim()) throw new BadRequestException('keyword is required');
        if (!branch_id) throw new BadRequestException('branch_id is required');
        if (!class_id) throw new BadRequestException('class_id is required');
        if (!section_id) throw new BadRequestException('section_id is required');

        const searchTerm = `%${keyword.trim()}%`;
        const params: any[] = [branch_id, class_id, section_id, searchTerm];

        let baseQuery = `
            SELECT 
                std.student_id,
                std.first_name,
                std.last_name,
                std.dob,
                std.email,
                std.gender,
                std.student_aadhar,
                std.admission_number,
                std.roll_number,
                std.is_ews,
                std.address,
                c.class_name,
                s.section_name
            FROM students std
            INNER JOIN classes c ON std.class_id = c.class_id
            INNER JOIN sections s ON std.section_id = s.section_id
            WHERE std.branch_id = $1 AND std.class_id = $2 AND std.section_id = $3 AND std.status = 1
            AND (std.first_name ILIKE $4 OR std.last_name ILIKE $4 OR std.admission_number ILIKE $4 OR std.email ILIKE $4)
        `;

        baseQuery += ` ORDER BY std.roll_number ASC`;

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
            message: 'Student search results fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async filterStudentList(filters: any, branch_id: number, class_id: number, section_id: number, page?: number, limit?: number) {
        if (!branch_id) throw new BadRequestException('branch_id is required');
        if (!class_id) throw new BadRequestException('class_id is required');
        if (!section_id) throw new BadRequestException('section_id is required');

        let baseQuery = `
            SELECT 
                std.student_id,
                std.first_name,
                std.last_name,
                std.dob,
                std.email,
                std.gender,
                std.student_aadhar,
                std.admission_number,
                std.roll_number,
                std.is_ews,
                std.address,
                c.class_name,
                s.section_name
            FROM students std
            INNER JOIN classes c ON std.class_id = c.class_id
            INNER JOIN sections s ON std.section_id = s.section_id
            WHERE std.branch_id = $1 AND std.class_id = $2 AND std.section_id = $3 AND std.status = 1
        `;

        const params: any[] = [branch_id, class_id, section_id];
        let paramIdx = 4;

        if (filters?.gender) {
            baseQuery += ` AND std.gender ILIKE $${paramIdx++}`;
            params.push(filters.gender);
        }

        if (filters?.is_ews !== undefined) {
            baseQuery += ` AND std.is_ews = $${paramIdx++}`;
            params.push(filters.is_ews);
        }

        baseQuery += ` ORDER BY std.roll_number ASC`;

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
            message: 'Student filter results fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }
}

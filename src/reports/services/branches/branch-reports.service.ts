import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class BranchReportsService {
    constructor(private readonly dataSource: DataSource) { }

    async getBranchSummary(page?: number, limit?: number) {
        let baseQuery = `
            SELECT 
                b.branch_id, 
                b.branch_name, 
                b.branch_code, 
                b.address,
                (SELECT COUNT(*) FROM students s WHERE s.branch_id = b.branch_id AND s.status = 1) as total_students,
                (SELECT COUNT(*) FROM teachers t WHERE t.branch_id = b.branch_id AND t.status = 1) as total_staff,
                (SELECT COUNT(*) FROM classes c WHERE c.branch_id = b.branch_id AND c.status = 1) as total_classes
            FROM branches b
            WHERE b.status = 1
        `;

        const params: any[] = [];
        let filterIdx = 1;

        baseQuery += ` ORDER BY b.branch_id ASC`;

        // Count total records for pagination
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        // Apply pagination
        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $${filterIdx++} OFFSET $${filterIdx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        const mappedData = result.map(item => ({
            branch_id: item.branch_id,
            branch_name: item.branch_name,
            branch_code: item.branch_code,
            address: item.address,
            total_students: parseInt(item.total_students || 0),
            total_staff: parseInt(item.total_staff || 0),
            total_classes: parseInt(item.total_classes || 0),
        }));

        return {
            status: true,
            message: 'Branch summary fetched successfully',
            data: mappedData,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async getBranchStudentSummary(page?: number, limit?: number) {
        let baseQuery = `
            SELECT 
                b.branch_id, 
                b.branch_name, 
                b.branch_code, 
                b.address,
                (SELECT COUNT(*) FROM students s WHERE s.branch_id = b.branch_id AND s.status = 1) as total_students
            FROM branches b
            WHERE b.status = 1
        `;

        const params: any[] = [];
        let filterIdx = 1;

        baseQuery += ` ORDER BY b.branch_id ASC`;

        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $${filterIdx++} OFFSET $${filterIdx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        const mappedData = result.map(item => ({
            branch_id: item.branch_id,
            branch_name: item.branch_name,
            branch_code: item.branch_code,
            address: item.address,
            total_students: parseInt(item.total_students || 0),
        }));

        return {
            status: true,
            message: 'Branch student summary fetched successfully',
            data: mappedData,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async getBranchStaffSummary(page?: number, limit?: number) {
        let baseQuery = `
            SELECT 
                b.branch_id, 
                b.branch_name, 
                b.branch_code, 
                b.address,
                (SELECT COUNT(*) FROM teachers t WHERE t.branch_id = b.branch_id AND t.status = 1) as total_staff
            FROM branches b
            WHERE b.status = 1
        `;

        const params: any[] = [];
        let filterIdx = 1;

        baseQuery += ` ORDER BY b.branch_id ASC`;

        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $${filterIdx++} OFFSET $${filterIdx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        const mappedData = result.map(item => ({
            branch_id: item.branch_id,
            branch_name: item.branch_name,
            branch_code: item.branch_code,
            address: item.address,
            total_staff: parseInt(item.total_staff || 0),
        }));

        return {
            status: true,
            message: 'Branch staff summary fetched successfully',
            data: mappedData,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async getBranchClassSummary(page?: number, limit?: number) {
        let baseQuery = `
            SELECT 
                b.branch_id, 
                b.branch_name, 
                b.branch_code, 
                b.address,
                (SELECT COUNT(*) FROM classes c WHERE c.branch_id = b.branch_id AND c.status = 1) as total_classes
            FROM branches b
            WHERE b.status = 1
        `;

        const params: any[] = [];
        let filterIdx = 1;

        baseQuery += ` ORDER BY b.branch_id ASC`;

        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $${filterIdx++} OFFSET $${filterIdx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        const mappedData = result.map(item => ({
            branch_id: item.branch_id,
            branch_name: item.branch_name,
            branch_code: item.branch_code,
            address: item.address,
            total_classes: parseInt(item.total_classes || 0),
        }));

        return {
            status: true,
            message: 'Branch class summary fetched successfully',
            data: mappedData,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async searchBranchSummary(keyword: string, page?: number, limit?: number) {
        if (!keyword?.trim()) throw new BadRequestException('keyword is required');

        const searchTerm = `%${keyword.trim()}%`;
        let params: any[] = [searchTerm];
        let pagination = '';

        if (page && limit) {
            const offset = (page - 1) * limit;
            pagination = `LIMIT $2 OFFSET $3`;
            params = [searchTerm, limit, offset];
        }

        const query = `
            SELECT 
            b.branch_id, 
            b.branch_name, 
            b.branch_code, 
            b.address,
            (SELECT COUNT(*) FROM students s WHERE s.branch_id = b.branch_id AND s.status = 1) AS total_students,
            (SELECT COUNT(*) FROM teachers t WHERE t.branch_id = b.branch_id AND t.status = 1) AS total_staff,
            (SELECT COUNT(*) FROM classes c WHERE c.branch_id = b.branch_id AND c.status = 1) AS total_classes
            FROM branches b
            WHERE b.status = 1
            AND (b.branch_name ILIKE $1 OR b.branch_code ILIKE $1)
            ORDER BY b.branch_name ASC
           ${pagination}
       `;

        const result = await this.dataSource.query(query, params);

        const countResult = await this.dataSource.query(
            `SELECT COUNT(*) FROM branches b 
             WHERE b.status = 1 AND (b.branch_name ILIKE $1 OR b.branch_code ILIKE $1)`,
            [searchTerm]
        );
        const totalRecords = Number(countResult[0].count);

        return {
            status: true,
            message: 'Branch search completed',
            data: result.map((r: any) => ({
                branch_id: r.branch_id,
                branch_name: r.branch_name,
                branch_code: r.branch_code,
                address: r.address,
                total_students: parseInt(r.total_students || 0),
                total_staff: parseInt(r.total_staff || 0),
                total_classes: parseInt(r.total_classes || 0),
            })),
            totalRecords,
            totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async filterBranchSummary(filters: any, page?: number, limit?: number) {
        let baseQuery = `
            SELECT 
            b.branch_id, 
            b.branch_name, 
            b.branch_code, 
            b.address,
            (SELECT COUNT(*) FROM students s WHERE s.branch_id = b.branch_id AND s.status = 1) AS total_students,
            (SELECT COUNT(*) FROM teachers t WHERE t.branch_id = b.branch_id AND t.status = 1) AS total_staff,
            (SELECT COUNT(*) FROM classes c WHERE c.branch_id = b.branch_id AND c.status = 1) AS total_classes
            FROM branches b
            WHERE b.status = 1
        `;

        const params: any[] = [];
        let paramIdx = 1;

        // Filter by branch_name (partial match)
        if (filters?.branch_name?.trim()) {
            baseQuery += ` AND b.branch_name ILIKE $${paramIdx}`;
            params.push(`%${filters.branch_name.trim()}%`);
            paramIdx++;
        }

        // Filter by address (partial match)
        if (filters?.address?.trim()) {
            baseQuery += ` AND b.address ILIKE $${paramIdx}`;
            params.push(`%${filters.address.trim()}%`);
            paramIdx++;
        }

        baseQuery += ` ORDER BY b.branch_name ASC`;

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS sub`;
        const countResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(countResult[0]?.total || '0', 10);

        // Apply pagination if requested
        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            baseQuery += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
            params.push(pageLimit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        const mappedData = result.map((item: any) => ({
            branch_id: item.branch_id,
            branch_name: item.branch_name,
            branch_code: item.branch_code,
            address: item.address,
            total_students: parseInt(item.total_students || 0),
            total_staff: parseInt(item.total_staff || 0),
            total_classes: parseInt(item.total_classes || 0),
        }));

        return {
            status: true,
            message: 'Branch summary filtered successfully',
            data: mappedData,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getStudentCountByClassSection(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];

        const query = `
            SELECT 
            b.branch_id,
            b.branch_name,
            b.branch_code,
            b.address,
            c.class_name,
            sec.section_name,
            COUNT(std.student_id) AS student_count
            FROM branches b
            INNER JOIN classes c ON c.branch_id = b.branch_id AND c.status = 1
            INNER JOIN class_section_assign csa 
            ON csa.class_id = c.class_id AND csa.branch_id = b.branch_id AND csa.status = 1
            INNER JOIN sections sec ON sec.section_id = csa.section_id
            LEFT JOIN students std 
            ON std.class_id = c.class_id 
            AND std.section_id = sec.section_id 
            AND std.branch_id = b.branch_id 
            AND std.status = 1
            WHERE b.branch_id = $1 AND b.status = 1
            GROUP BY 
            b.branch_id, b.branch_name, b.branch_code, b.address,
            c.class_id, c.class_name, 
            sec.section_id, sec.section_name
            ORDER BY c.class_name, sec.section_name
        `;

        let result: any[];
        let totalRecords = 0;

        if (page && limit) {
            const currentPage = page < 1 ? 1 : page;
            const pageLimit = limit < 1 ? 10 : limit;
            const offset = (currentPage - 1) * pageLimit;

            // Get total count
            const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS counted`;
            const countResult = await this.dataSource.query(countQuery, params);
            totalRecords = parseInt(countResult[0]?.total || '0', 10);

            // Apply pagination
            const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);

            result = await this.dataSource.query(paginatedQuery, params);
        } else {
            // No pagination → get all
            result = await this.dataSource.query(query, params);
            totalRecords = result.length;
        }

        return {
            status: true,
            message: 'Student count per class-section fetched successfully',
            data: result.map((row: any) => ({
                branch_id: row.branch_id,
                branch_name: row.branch_name,
                branch_code: row.branch_code,
                address: row.address,
                class_name: row.class_name,
                section_name: row.section_name,
                student_count: parseInt(row.student_count || 0),
            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,

        };
    }

    async searchStudentCount(keyword: string, branch_id: number, page?: number, limit?: number) {
        if (!keyword?.trim()) {
            throw new BadRequestException('keyword is required');
        }
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const searchTerm = `%${keyword.trim()}%`;

        let params: any[] = [branch_id, searchTerm];
        let pagination = '';

        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            pagination = `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);
        }

        const query = `
        SELECT 
        b.branch_id,
        b.branch_name,
        b.branch_code,
        b.address,
        c.class_name, 
        sec.section_name, 
        COUNT(std.student_id) AS student_count
        FROM class_section_assign csa
        INNER JOIN branches b ON b.branch_id = csa.branch_id AND b.status = 1
        INNER JOIN classes c ON c.class_id = csa.class_id AND c.status = 1
        INNER JOIN sections sec ON sec.section_id = csa.section_id
        LEFT JOIN students std 
        ON std.class_id = c.class_id 
        AND std.section_id = sec.section_id 
        AND std.branch_id = csa.branch_id
        AND std.status = 1
        WHERE csa.branch_id = $1 
        AND csa.status = 1
        AND (c.class_name ILIKE $2 OR sec.section_name ILIKE $2)
        GROUP BY b.branch_id, b.branch_name, b.branch_code, b.address, c.class_id, c.class_name, sec.section_id, sec.section_name
        ORDER BY c.class_name, sec.section_name
        ${pagination}
    `;

        const result = await this.dataSource.query(query, params);

        const countQuery = `
        SELECT COUNT(*) AS total
        FROM (
        SELECT 1
        FROM class_section_assign csa
        INNER JOIN branches b ON b.branch_id = csa.branch_id AND b.status = 1
        INNER JOIN classes c ON c.class_id = csa.class_id AND c.status = 1
        INNER JOIN sections sec ON sec.section_id = csa.section_id
        WHERE csa.branch_id = $1 
            AND csa.status = 1
            AND (c.class_name ILIKE $2 OR sec.section_name ILIKE $2)
        GROUP BY b.branch_id, c.class_id, c.class_name, sec.section_id, sec.section_name
        ) AS sub
    `;

        const countResult = await this.dataSource.query(countQuery, [branch_id, searchTerm]);
        const totalRecords = Number(countResult[0]?.total || 0);

        return {
            status: true,
            message: 'Student count search completed',
            data: result.map((row: any) => ({
                branch_id: row.branch_id,
                branch_name: row.branch_name,
                branch_code: row.branch_code,
                address: row.address,
                class_name: row.class_name,
                section_name: row.section_name,
                student_count: parseInt(row.student_count || 0),
            })),
            totalRecords,
            totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1,
        };
    }

    async filterStudentCountByClassSection(branch_id: number, filters: any, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        let baseQuery = `
            SELECT 
            b.branch_id,
            b.branch_name,
            b.branch_code,
            b.address,
            c.class_name,
            sec.section_name,
            COUNT(std.student_id) AS student_count
            FROM branches b
            INNER JOIN classes c ON c.branch_id = b.branch_id AND c.status = 1
            INNER JOIN class_section_assign csa 
            ON csa.class_id = c.class_id AND csa.branch_id = b.branch_id AND csa.status = 1
            INNER JOIN sections sec ON sec.section_id = csa.section_id
            LEFT JOIN students std 
            ON std.class_id = c.class_id 
            AND std.section_id = sec.section_id 
            AND std.branch_id = b.branch_id 
            AND std.status = 1
            WHERE b.branch_id = $1 
            AND b.status = 1
            AND csa.status = 1
        `;

        const params: any[] = [branch_id];
        let paramIdx = 2;

        // Filter by class_name
        if (filters?.class_name?.trim()) {
            baseQuery += ` AND c.class_name ILIKE $${paramIdx}`;
            params.push(`%${filters.class_name.trim()}%`);
            paramIdx++;
        }

        // Filter by section_name
        if (filters?.section_name?.trim()) {
            baseQuery += ` AND sec.section_name ILIKE $${paramIdx}`;
            params.push(`%${filters.section_name.trim()}%`);
            paramIdx++;
        }

        baseQuery += `
            GROUP BY 
            b.branch_id, b.branch_name, b.branch_code, b.address,
            c.class_id, c.class_name, 
            sec.section_id, sec.section_name
            ORDER BY c.class_name, sec.section_name
        `;

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS sub`;
        const countResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(countResult[0]?.total || '0', 10);

        // Apply pagination if requested
        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            baseQuery += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
            params.push(pageLimit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        const mappedData = result.map((row: any) => ({
            branch_id: row.branch_id,
            branch_name: row.branch_name,
            branch_code: row.branch_code,
            address: row.address,
            class_name: row.class_name,
            section_name: row.section_name,
            student_count: parseInt(row.student_count || 0),
        }));

        return {
            status: true,
            message: 'Student count filtered successfully',
            data: mappedData,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getTeachersByClassSection(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];

        const query = `
            SELECT 
            b.branch_id,
            b.branch_name,
            b.branch_code,
            b.address,
            c.class_name,
            sec.section_name,
            TRIM(CONCAT(t.first_name, ' ', t.last_name)) AS teacher_name
            FROM branches b
            INNER JOIN classes c ON c.branch_id = b.branch_id AND c.status = 1
            INNER JOIN class_section_assign csa 
            ON csa.class_id = c.class_id AND csa.branch_id = b.branch_id AND csa.status = 1
            INNER JOIN sections sec ON sec.section_id = csa.section_id
            LEFT JOIN teachers t ON t.teacher_id = csa.teacher_id AND t.status = 1
            WHERE b.branch_id = $1 AND b.status = 1
            ORDER BY c.class_name, sec.section_name
        `;

        let result: any[];
        let totalRecords = 0;

        if (page && limit) {
            const currentPage = page < 1 ? 1 : page;
            const pageLimit = limit < 1 ? 10 : limit;
            const offset = (currentPage - 1) * pageLimit;

            const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS counted`;
            const countResult = await this.dataSource.query(countQuery, params);
            totalRecords = parseInt(countResult[0]?.total || '0', 10);

            const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);

            result = await this.dataSource.query(paginatedQuery, params);
        } else {
            result = await this.dataSource.query(query, params);
            totalRecords = result.length;
        }

        return {
            status: true,
            message: 'Class teachers per class-section fetched successfully',
            data: result.map((row: any) => ({
                branch_id: row.branch_id,
                branch_name: row.branch_name,
                branch_code: row.branch_code,
                address: row.address,
                class_name: row.class_name,
                section_name: row.section_name,
                teacher_name: row.teacher_name || 'Not Assigned',
            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,

        };
    }

    async searchTeachersByClassSection(keyword: string, branch_id: number, page?: number, limit?: number,) {
        if (!keyword?.trim()) {
            throw new BadRequestException('keyword is required');
        }
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const searchTerm = `%${keyword.trim()}%`;

        let params: any[] = [branch_id, searchTerm]; // $1 = branch_id, $2 = searchTerm
        let pagination = '';

        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            pagination = `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);
        }

        const query = `
        SELECT 
        b.branch_id,
        b.branch_name,
        b.branch_code,
        b.address,
        c.class_name,
        sec.section_name,
        TRIM(CONCAT(t.first_name, ' ', t.last_name)) AS teacher_name
        FROM class_section_assign csa
        INNER JOIN branches b ON b.branch_id = csa.branch_id AND b.status = 1
        INNER JOIN classes c ON c.class_id = csa.class_id AND c.status = 1
        INNER JOIN sections sec ON sec.section_id = csa.section_id
        LEFT JOIN teachers t ON t.teacher_id = csa.teacher_id AND t.status = 1
        WHERE csa.branch_id = $1 
        AND csa.status = 1
        AND (
            b.branch_name ILIKE $2 OR
            c.class_name ILIKE $2 OR
            sec.section_name ILIKE $2 OR
            CONCAT(t.first_name, ' ', t.last_name) ILIKE $2
        )
        ORDER BY c.class_name, sec.section_name
        ${pagination}
    `;

        const result = await this.dataSource.query(query, params);

        // Total count query
        const countQuery = `
        SELECT COUNT(*) AS total
        FROM (
        SELECT 1
        FROM class_section_assign csa
        INNER JOIN branches b ON b.branch_id = csa.branch_id AND b.status = 1
        INNER JOIN classes c ON c.class_id = csa.class_id AND c.status = 1
        INNER JOIN sections sec ON sec.section_id = csa.section_id
        LEFT JOIN teachers t ON t.teacher_id = csa.teacher_id AND t.status = 1
        WHERE csa.branch_id = $1 
            AND csa.status = 1
            AND (
            b.branch_name ILIKE $2 OR
            c.class_name ILIKE $2 OR
            sec.section_name ILIKE $2 OR
            CONCAT(t.first_name, ' ', t.last_name) ILIKE $2
            )
        ) AS sub
    `;

        const countResult = await this.dataSource.query(countQuery, [branch_id, searchTerm]);
        const totalRecords = Number(countResult[0]?.total || 0);

        return {
            status: true,
            message: 'Teacher allocation search completed',
            data: result.map((row: any) => ({
                branch_id: row.branch_id,
                branch_name: row.branch_name,
                branch_code: row.branch_code,
                address: row.address,
                class_name: row.class_name,
                section_name: row.section_name,
                teacher_name: row.teacher_name || 'Not Assigned',
            })),
            totalRecords,
            totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1,
        };
    }

    async filterTeachersByClassSection(branch_id: number, filters: any, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        let baseQuery = `
            SELECT 
            b.branch_id,
            b.branch_name,
            b.branch_code,
            b.address,
            c.class_name,
            sec.section_name,
            TRIM(CONCAT(t.first_name, ' ', t.last_name)) AS teacher_name
            FROM branches b
            INNER JOIN classes c ON c.branch_id = b.branch_id AND c.status = 1
            INNER JOIN class_section_assign csa 
            ON csa.class_id = c.class_id AND csa.branch_id = b.branch_id AND csa.status = 1
            INNER JOIN sections sec ON sec.section_id = csa.section_id
            LEFT JOIN teachers t ON t.teacher_id = csa.teacher_id AND t.status = 1
            WHERE b.branch_id = $1 
            AND b.status = 1
            AND csa.status = 1
        `;

        const params: any[] = [branch_id];
        let paramIdx = 2;

        // Filter by class_name
        if (filters?.class_name?.trim()) {
            baseQuery += ` AND c.class_name ILIKE $${paramIdx}`;
            params.push(`%${filters.class_name.trim()}%`);
            paramIdx++;
        }

        // Filter by section_name
        if (filters?.section_name?.trim()) {
            baseQuery += ` AND sec.section_name ILIKE $${paramIdx}`;
            params.push(`%${filters.section_name.trim()}%`);
            paramIdx++;
        }

        // Filter by teacher_name
        if (filters?.teacher_name?.trim()) {
            baseQuery += ` AND CONCAT(t.first_name, ' ', t.last_name) ILIKE $${paramIdx}`;
            params.push(`%${filters.teacher_name.trim()}%`);
            paramIdx++;
        }

        baseQuery += `
            ORDER BY c.class_name, sec.section_name
        `;

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS sub`;
        const countResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(countResult[0]?.total || '0', 10);

        // Apply pagination if requested
        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            baseQuery += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
            params.push(pageLimit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        const mappedData = result.map((row: any) => ({
            branch_id: row.branch_id,
            branch_name: row.branch_name,
            branch_code: row.branch_code,
            address: row.address,
            class_name: row.class_name,
            section_name: row.section_name,
            teacher_name: row.teacher_name || 'Not Assigned',
        }));

        return {
            status: true,
            message: 'Teacher allocation filtered successfully',
            data: mappedData,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getSubjectsByClass(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];

        const query = `
            SELECT 
            b.branch_id,
            b.branch_name,
            b.branch_code,
            b.address,
            c.class_name,
            STRING_AGG(ms.subject_name, ', ' ORDER BY ms.subject_name) AS subject_names,
            COUNT(sub.id) AS total_subjects
            FROM branches b
            INNER JOIN classes c 
            ON c.branch_id = b.branch_id AND c.status = 1
            LEFT JOIN subjects sub 
            ON sub.class_id = c.class_id 
            AND sub.branch_id = b.branch_id 
            AND sub.status = 1
            LEFT JOIN master_subjects ms 
            ON ms.id = sub.master_subject_id 
            AND ms.status = 1
            WHERE b.branch_id = $1 AND b.status = 1
            GROUP BY 
            b.branch_id, b.branch_name, b.branch_code, b.address,
            c.class_id, c.class_name
            ORDER BY c.class_name
        `;

        let result: any[];
        let totalRecords = 0;

        if (page && limit) {
            const currentPage = page < 1 ? 1 : page;
            const pageLimit = limit < 1 ? 10 : limit;
            const offset = (currentPage - 1) * pageLimit;

            // Get total count for pagination
            const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS counted`;
            const countResult = await this.dataSource.query(countQuery, params);
            totalRecords = parseInt(countResult[0]?.total || '0', 10);

            // Apply LIMIT and OFFSET
            const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);

            result = await this.dataSource.query(paginatedQuery, params);
        } else {
            // No pagination → return all classes
            result = await this.dataSource.query(query, params);
            totalRecords = result.length;
        }

        return {
            status: true,
            message: 'Subjects allocated per class fetched successfully',
            data: result.map((row: any) => ({
                branch_id: row.branch_id,
                branch_name: row.branch_name,
                branch_code: row.branch_code,
                address: row.address,

                class_id: row.class_id,
                class_name: row.class_name,
                subject_names: row.subject_names || 'No subjects assigned',
                total_subjects: parseInt(row.total_subjects || 0),
            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async searchSubjectsByClass(keyword: string, branch_id: number, page?: number, limit?: number) {
        if (!keyword?.trim()) {
            throw new BadRequestException('keyword is required');
        }
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const searchTerm = `%${keyword.trim()}%`;

        let params: any[] = [branch_id, searchTerm]; // $1 = branch_id, $2 = searchTerm
        let pagination = '';

        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            pagination = `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);
        }

        const query = `
            SELECT 
            b.branch_id,
            b.branch_name,
            b.branch_code,
            b.address,
            c.class_name,
            STRING_AGG(sub.name, ', ' ORDER BY sub.name) AS subject_names,
            COUNT(sub.id) AS total_subjects
            FROM branches b
            INNER JOIN classes c 
            ON c.branch_id = b.branch_id AND c.status = 1
            LEFT JOIN subjects sub 
            ON sub.class_id = c.class_id 
            AND sub.branch_id = b.branch_id 
            AND sub.status = 1
            WHERE b.branch_id = $1 
            AND b.status = 1
            AND (
                b.branch_name ILIKE $2 OR
                c.class_name ILIKE $2 OR
                sub.name ILIKE $2
            )
            GROUP BY 
            b.branch_id, b.branch_name, b.branch_code, b.address,
            c.class_id, c.class_name
            ORDER BY c.class_name
            ${pagination}
        `;

        const result = await this.dataSource.query(query, params);

        // Total count query (without pagination)
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM (
            SELECT 1
            FROM branches b
            INNER JOIN classes c 
                ON c.branch_id = b.branch_id AND c.status = 1
            LEFT JOIN subjects sub 
                ON sub.class_id = c.class_id 
                AND sub.branch_id = b.branch_id 
                AND sub.status = 1
            WHERE b.branch_id = $1 
                AND b.status = 1
                AND (
                b.branch_name ILIKE $2 OR
                c.class_name ILIKE $2 OR
                sub.name ILIKE $2
                )
            GROUP BY b.branch_id, c.class_id, c.class_name
            ) AS sub
        `;

        const countResult = await this.dataSource.query(countQuery, [branch_id, searchTerm]);
        const totalRecords = Number(countResult[0]?.total || 0);

        return {
            status: true,
            message: 'Subjects per class search completed',
            data: result.map((row: any) => ({
                branch_id: row.branch_id,
                branch_name: row.branch_name,
                branch_code: row.branch_code,
                address: row.address,
                class_name: row.class_name,
                subject_names: row.subject_names || 'No subjects assigned',
                total_subjects: parseInt(row.total_subjects || 0),
            })),
            totalRecords,
            totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1,
        };
    }

    async filterSubjectsByClass(branch_id: number, filters: any, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        let baseQuery = `
        SELECT 
        b.branch_id,
        b.branch_name,
        b.branch_code,
        b.address,
        c.class_name,
        STRING_AGG(sub.name, ', ' ORDER BY sub.name) AS subject_names,
        COUNT(sub.id) AS total_subjects
        FROM branches b
        INNER JOIN classes c 
        ON c.branch_id = b.branch_id AND c.status = 1
        LEFT JOIN subjects sub 
        ON sub.class_id = c.class_id 
        AND sub.branch_id = b.branch_id 
        AND sub.status = 1
        WHERE b.branch_id = $1 
        AND b.status = 1
      `;

        const params: any[] = [branch_id];
        let paramIdx = 2;

        // Filter by class_name
        if (filters?.class_name?.trim()) {
            baseQuery += ` AND c.class_name ILIKE $${paramIdx}`;
            params.push(`%${filters.class_name.trim()}%`);
            paramIdx++;
        }

        // Filter by subject_name (checks if any subject contains the keyword)
        if (filters?.subject_name?.trim()) {
            baseQuery += ` AND sub.name ILIKE $${paramIdx}`;
            params.push(`%${filters.subject_name.trim()}%`);
            paramIdx++;
        }

        baseQuery += `
            GROUP BY 
            b.branch_id, b.branch_name, b.branch_code, b.address,
            c.class_id, c.class_name
            ORDER BY c.class_name
        `;

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS sub`;
        const countResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(countResult[0]?.total || '0', 10);

        // Apply pagination if requested
        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            baseQuery += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
            params.push(pageLimit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        const mappedData = result.map((row: any) => ({
            branch_id: row.branch_id,
            branch_name: row.branch_name,
            branch_code: row.branch_code,
            address: row.address,
            class_name: row.class_name,
            subject_names: row.subject_names || 'No subjects assigned',
            total_subjects: parseInt(row.total_subjects || 0),
        }));

        return {
            status: true,
            message: 'Subjects per class filtered successfully',
            data: mappedData,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getRoomsAllocations(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        let query = `
            SELECT 
            r.id,
            r.name,
            r.type,
            r.capacity,
            b.branch_name,
            b.branch_code,
            b.address
            FROM rooms r
            LEFT JOIN branches b ON r.branch_id = b.branch_id
            WHERE r.branch_id = $1
            AND r.status = 1
            ORDER BY r.id ASC
        `;

        const params: any[] = [branch_id];
        let paramIdx = 2;

        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            query += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
            params.push(pageLimit, offset);
        }

        const result = await this.dataSource.query(query, params);

        const totalRecordsResult = await this.dataSource.query(`
            SELECT COUNT(*) FROM rooms r
            LEFT JOIN branches b ON r.branch_id = b.branch_id
            WHERE r.branch_id = $1
            AND r.status = 1
            `, [branch_id]);

        const totalRecords = parseInt(totalRecordsResult[0]?.count || '0', 10);

        const mappedData = result.map((row: any) => ({
            branch_name: row.branch_name,
            branch_code: row.branch_code,
            address: row.address,
            name: row.name,
            type: row.type,
            capacity: row.capacity,
        }));

        return {
            status: true,
            message: 'Rooms allocations fetched successfully',
            data: mappedData,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async searchRoomsAllocations(keyword: string, branch_id: number, page?: number, limit?: number) {
        if (!keyword?.trim()) {
            throw new BadRequestException('keyword is required');
        }
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const searchTerm = `%${keyword.trim()}%`;

        let params: any[] = [branch_id, searchTerm];
        let pagination = '';

        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            pagination = `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);
        }

        const query = `
            SELECT 
            r.id,
            r.name,
            r.type,
            r.capacity,
            b.branch_name,
            b.branch_code,
            b.address
            FROM rooms r
            LEFT JOIN branches b ON r.branch_id = b.branch_id
            WHERE r.branch_id = $1
            AND r.status = 1
            AND (
                r.name ILIKE $2 OR
                r.type ILIKE $2 OR
                b.branch_name ILIKE $2
            )
            ORDER BY r.name ASC
            ${pagination}
        `;

        const result = await this.dataSource.query(query, params);

        // Total count
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM rooms r
            LEFT JOIN branches b ON r.branch_id = b.branch_id
            WHERE r.branch_id = $1
            AND r.status = 1
            AND (
                r.name ILIKE $2 OR
                r.type ILIKE $2 OR
                b.branch_name ILIKE $2
            )
        `;

        const countResult = await this.dataSource.query(countQuery, [branch_id, searchTerm]);
        const totalRecords = Number(countResult[0]?.total || 0);

        return {
            status: true,
            message: 'Rooms search completed',
            data: result.map((row: any) => ({
                id: row.id,
                name: row.name,
                type: row.type,
                capacity: parseInt(row.capacity || 0),
                branch_name: row.branch_name,
                branch_code: row.branch_code,
                address: row.address,
            })),
            totalRecords,
            totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async filterRoomsAllocations(branch_id: number, filters: any, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        let baseQuery = `
            SELECT 
            r.id,
            r.name,
            r.type,
            r.capacity,
            b.branch_name,
            b.branch_code,
            b.address
            FROM rooms r
            LEFT JOIN branches b ON r.branch_id = b.branch_id
            WHERE r.branch_id = $1
            AND r.status = 1
        `;

        const params: any[] = [branch_id];
        let paramIdx = 2;

        // Filter by name (partial)
        if (filters?.name?.trim()) {
            baseQuery += ` AND r.name ILIKE $${paramIdx}`;
            params.push(`%${filters.name.trim()}%`);
            paramIdx++;
        }

        // Filter by type (exact or partial)
        if (filters?.type?.trim()) {
            baseQuery += ` AND r.type ILIKE $${paramIdx}`;
            params.push(`%${filters.type.trim()}%`);
            paramIdx++;
        }

        // Min capacity
        if (filters?.min_capacity !== undefined && filters.min_capacity >= 0) {
            baseQuery += ` AND r.capacity >= $${paramIdx}`;
            params.push(filters.min_capacity);
            paramIdx++;
        }

        // Max capacity
        if (filters?.max_capacity !== undefined && filters.max_capacity >= 0) {
            baseQuery += ` AND r.capacity <= $${paramIdx}`;
            params.push(filters.max_capacity);
            paramIdx++;
        }

        baseQuery += ` ORDER BY r.name ASC`;

        // Total count
        const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS sub`;
        const countResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(countResult[0]?.total || '0', 10);

        // Pagination
        if (page && limit) {
            const currentPage = Math.max(1, page);
            const pageLimit = Math.max(1, limit);
            const offset = (currentPage - 1) * pageLimit;

            baseQuery += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
            params.push(pageLimit, offset);
        }

        const result = await this.dataSource.query(baseQuery, params);

        const mappedData = result.map((row: any) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            capacity: parseInt(row.capacity || 0),
            branch_name: row.branch_name,
            branch_code: row.branch_code,
            address: row.address,
        }));

        return {
            status: true,
            message: 'Rooms filtered successfully',
            data: mappedData,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getTeacherSubjectAllocationByClass(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];

        const query = `
            SELECT 
                ts.id,
                b.branch_name,
                b.branch_code,
                b.address,
                c.class_name,
                ms.subject_name,
                TRIM(CONCAT(t.first_name, ' ', t.last_name)) AS teacher_name,
                t.contact_number as teacher_contact
            FROM teacher_subjects_allocation ts
            INNER JOIN teachers t ON t.teacher_id = ts.teacher_id AND t.status = 1
            INNER JOIN subjects s ON s.id = ts.subject_id AND s.status = 1
            LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
            INNER JOIN classes c ON c.class_id = ts.class_id AND c.status = 1
            INNER JOIN branches b ON b.branch_id = ts.branch_id AND b.status = 1
            WHERE ts.branch_id = $1 AND ts.status = 1
            ORDER BY ts.id ASC
        `;

        let result: any[];
        let totalRecords = 0;

        if (page && limit) {
            const currentPage = page < 1 ? 1 : page;
            const pageLimit = limit < 1 ? 10 : limit;
            const offset = (currentPage - 1) * pageLimit;

            const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS counted`;
            const countResult = await this.dataSource.query(countQuery, params);
            totalRecords = parseInt(countResult[0]?.total || '0', 10);

            const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);

            result = await this.dataSource.query(paginatedQuery, params);
        } else {
            result = await this.dataSource.query(query, params);
            totalRecords = result.length;
        }

        return {
            status: true,
            message: 'Teacher subject allocations fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async searchTeacherSubjectAllocation(keyword: string, branch_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const search = `%${keyword}%`;
        const params: any[] = [branch_id, search];

        const query = `
            SELECT 
                ts.id,
                b.branch_name,
                b.branch_code,
                b.address,
                c.class_name,
                ms.subject_name,
                TRIM(CONCAT(t.first_name, ' ', t.last_name)) AS teacher_name,
                t.contact_number as teacher_contact
            FROM teacher_subjects_allocation ts
            INNER JOIN teachers t ON t.teacher_id = ts.teacher_id AND t.status = 1
            INNER JOIN subjects s ON s.id = ts.subject_id AND s.status = 1
            LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
            INNER JOIN classes c ON c.class_id = ts.class_id AND c.status = 1
            INNER JOIN branches b ON b.branch_id = ts.branch_id AND b.status = 1
            WHERE ts.branch_id = $1 AND ts.status = 1
            AND (
                CONCAT(t.first_name, ' ', t.last_name) ILIKE $2
                OR c.class_name ILIKE $2
                OR ms.subject_name ILIKE $2
            )
            ORDER BY ts.id ASC
        `;

        let result: any[];
        let totalRecords = 0;

        if (page && limit) {
            const currentPage = page < 1 ? 1 : page;
            const pageLimit = limit < 1 ? 10 : limit;
            const offset = (currentPage - 1) * pageLimit;

            const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS counted`;
            const countResult = await this.dataSource.query(countQuery, params);
            totalRecords = parseInt(countResult[0]?.total || '0', 10);

            const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);

            result = await this.dataSource.query(paginatedQuery, params);
        } else {
            result = await this.dataSource.query(query, params);
            totalRecords = result.length;
        }

        return {
            status: true,
            message: 'Teacher subject allocations searched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async filterTeacherSubjectAllocation(branch_id: number, filters: any, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];
        let paramIdx = 2;
        let whereClause = `WHERE ts.branch_id = $1 AND ts.status = 1`;

        if (filters.class_name) {
            whereClause += ` AND c.class_name ILIKE $${paramIdx++}`;
            params.push(filters.class_name);
        }
        if (filters.teacher_name) {
            whereClause += ` AND TRIM(CONCAT(t.first_name, ' ', t.last_name)) ILIKE $${paramIdx++}`;
            params.push(filters.teacher_name);
        }
        if (filters.subject_name) {
            whereClause += ` AND ms.subject_name ILIKE $${paramIdx++}`;
            params.push(filters.subject_name);
        }

        const query = `
            SELECT 
                ts.id,
                b.branch_name,
                b.branch_code,
                b.address,
                c.class_name,
                ms.subject_name,
                TRIM(CONCAT(t.first_name, ' ', t.last_name)) AS teacher_name,
                t.contact_number as teacher_contact
            FROM teacher_subjects_allocation ts
            INNER JOIN teachers t ON t.teacher_id = ts.teacher_id AND t.status = 1
            INNER JOIN subjects s ON s.id = ts.subject_id AND s.status = 1
            LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
            INNER JOIN classes c ON c.class_id = ts.class_id AND c.status = 1
            INNER JOIN branches b ON b.branch_id = ts.branch_id AND b.status = 1
            ${whereClause}
            ORDER BY ts.id ASC
        `;

        let result: any[];
        let totalRecords = 0;

        if (page && limit) {
            const currentPage = page < 1 ? 1 : page;
            const pageLimit = limit < 1 ? 10 : limit;
            const offset = (currentPage - 1) * pageLimit;

            const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS counted`;
            const countResult = await this.dataSource.query(countQuery, params);
            totalRecords = parseInt(countResult[0]?.total || '0', 10);

            const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);

            result = await this.dataSource.query(paginatedQuery, params);
        } else {
            result = await this.dataSource.query(query, params);
            totalRecords = result.length;
        }

        return {
            status: true,
            message: 'Teacher subject allocations filtered successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getSubjectWiseTeacherAllocation(branch_id: number, class_id: number, page?: number, limit?: number) {
        if (!branch_id || !class_id) {
            throw new BadRequestException('branch_id, class_id are required');
        }

        const query = `
            SELECT 
                b.branch_name,
                c.class_name,
                ms.subject_name,
                CONCAT(t.first_name, ' ', t.last_name) AS teacher_name
            FROM teacher_subjects_allocation ts
            LEFT JOIN branches b on b.branch_id = ts.branch_id
            LEFT JOIN classes c on c.class_id = ts.class_id
            LEFT JOIN subjects s on s.id = ts.subject_id
            LEFT JOIN master_subjects ms on ms.id = s.master_subject_id
            LEFT JOIN teachers t on t.teacher_id = ts.teacher_id
            WHERE ts.branch_id = $1 AND ts.class_id = $2 AND ts.status = 1
            ORDER BY ms.subject_name
        `;

        const params: any[] = [branch_id, class_id];
        let result: any[];
        let totalRecords = 0;

        if (page && limit) {
            const currentPage = page < 1 ? 1 : page;
            const pageLimit = limit < 1 ? 10 : limit;
            const offset = (currentPage - 1) * pageLimit;

            const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS counted`;
            const countResult = await this.dataSource.query(countQuery, params);
            totalRecords = parseInt(countResult[0]?.total || '0', 10);

            const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);

            result = await this.dataSource.query(paginatedQuery, params);
        } else {
            result = await this.dataSource.query(query, params);
            totalRecords = result.length;
        }

        return {
            status: true,
            message: 'Subject-wise teacher allocations fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async searchSubjectWiseTeacherAllocation(keyword: string, branch_id: number, class_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const searchTerm = `%${keyword}%`;
        const query = `
            SELECT 
                b.branch_name,
                c.class_name,
                ms.subject_name,
                CONCAT(t.first_name, ' ', t.last_name) AS teacher_name
            FROM teacher_subjects_allocation ts
            LEFT JOIN branches b on b.branch_id = ts.branch_id
            LEFT JOIN classes c on c.class_id = ts.class_id
            LEFT JOIN subjects s on s.id = ts.subject_id
            LEFT JOIN master_subjects ms on ms.id = s.master_subject_id
            LEFT JOIN teachers t on t.teacher_id = ts.teacher_id
            WHERE ts.branch_id = $1 AND ts.class_id = $2 AND ts.status = 1
            AND (
                ms.subject_name ILIKE $3
                OR CONCAT(t.first_name, ' ', t.last_name) ILIKE $3
            )
            ORDER BY ms.subject_name
        `;

        const params: any[] = [branch_id, class_id, searchTerm];
        let result: any[];
        let totalRecords = 0;

        if (page && limit) {
            const currentPage = page < 1 ? 1 : page;
            const pageLimit = limit < 1 ? 10 : limit;
            const offset = (currentPage - 1) * pageLimit;

            const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS counted`;
            const countResult = await this.dataSource.query(countQuery, params);
            totalRecords = parseInt(countResult[0]?.total || '0', 10);

            const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);

            result = await this.dataSource.query(paginatedQuery, params);
        } else {
            result = await this.dataSource.query(query, params);
            totalRecords = result.length;
        }

        return {
            status: true,
            message: 'Subject-wise teacher allocations searched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }
    async getStaffListByBranch(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];

        const query = `
            SELECT 
            t.teacher_id,
            t.first_name,
            t.last_name,
            t.email,
            t.contact_number,
            t.joining_date,
            t.experience_years,
            b.branch_name,
            b.branch_code,
            b.address
            FROM teachers t
            INNER JOIN branches b ON b.branch_id = t.branch_id AND b.status = 1
            WHERE t.branch_id = $1 AND t.status = 1
            ORDER BY t.first_name ASC, t.last_name ASC
        `;

        let result: any[];
        let totalRecords = 0;

        if (page && limit) {
            const currentPage = page < 1 ? 1 : page;
            const pageLimit = limit < 1 ? 10 : limit;
            const offset = (currentPage - 1) * pageLimit;

            const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS counted`;
            const countResult = await this.dataSource.query(countQuery, params);
            totalRecords = parseInt(countResult[0]?.total || '0', 10);

            const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);

            result = await this.dataSource.query(paginatedQuery, params);
        } else {
            result = await this.dataSource.query(query, params);
            totalRecords = result.length;
        }

        return {
            status: true,
            message: 'Staff list fetched successfully',
            data: result.map((row: any) => ({
                teacher_id: row.teacher_id,
                name: `${row.first_name} ${row.last_name}`.trim(),
                email: row.email,
                contact_number: row.contact_number,
                joining_date: row.joining_date,
                experience_years: row.experience_years,
                branch_name: row.branch_name,
                branch_code: row.branch_code,
                address: row.address,
            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async searchStaffListByBranch(keyword: string, branch_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }
        if (!keyword?.trim()) {
            throw new BadRequestException('keyword is required');
        }

        const searchTerm = `%${keyword.trim()}%`;
        const params: any[] = [branch_id, searchTerm];

        const query = `
            SELECT 
            t.teacher_id,
            t.first_name,
            t.last_name,
            t.email,
            t.contact_number,
            t.joining_date,
            t.experience_years,
            b.branch_name,
            b.branch_code,
            b.address
            FROM teachers t
            INNER JOIN branches b ON b.branch_id = t.branch_id AND b.status = 1
            WHERE t.branch_id = $1 AND t.status = 1
            AND (
                t.first_name ILIKE $2 OR 
                t.last_name ILIKE $2 OR 
                t.email ILIKE $2 OR 
                t.contact_number ILIKE $2
            )
            ORDER BY t.first_name ASC, t.last_name ASC
        `;

        let result: any[];
        let totalRecords = 0;

        if (page && limit) {
            const currentPage = page < 1 ? 1 : page;
            const pageLimit = limit < 1 ? 10 : limit;
            const offset = (currentPage - 1) * pageLimit;

            const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS counted`;
            const countResult = await this.dataSource.query(countQuery, params);
            totalRecords = parseInt(countResult[0]?.total || '0', 10);

            const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageLimit, offset);

            result = await this.dataSource.query(paginatedQuery, params);
        } else {
            result = await this.dataSource.query(query, params);
            totalRecords = result.length;
        }

        return {
            status: true,
            message: 'Staff list searched successfully',
            data: result.map((row: any) => ({
                teacher_id: row.teacher_id,
                name: `${row.first_name} ${row.last_name}`.trim(),
                email: row.email,
                contact_number: row.contact_number,
                joining_date: row.joining_date,
                experience_years: row.experience_years,
                branch_name: row.branch_name,
                branch_code: row.branch_code,
                address: row.address,
            })),
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }
}

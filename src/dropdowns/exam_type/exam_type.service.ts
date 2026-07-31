import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ExamTypeService {
    constructor(@InjectDataSource() private dataSource: DataSource) { }

    // CREATE
    async create(exam_type: string) {
        if (!exam_type || exam_type.trim() === '') {
            throw new BadRequestException('Exam type name is required');
        }

        const trimmedName = exam_type.trim();

        const exists = await this.dataSource.query(
            `SELECT exam_type_id FROM exam_types WHERE LOWER(exam_type) = LOWER($1) AND status = 1 LIMIT 1`,
            [trimmedName],
        );

        if (exists.length > 0) {
            throw new BadRequestException('Exam type already exists');
        }

        const result = await this.dataSource.query(
            `INSERT INTO exam_types (exam_type, status, created_at, updated_at)
           VALUES ($1, 1, NOW(), NOW())
           RETURNING exam_type_id, exam_type, status`,
            [trimmedName],
        );

        return {
            status: true,
            message: 'Exam type created successfully',
            data: result[0],
        };
    }

    // GET ALL (with pagination)
    async findAll(page?: number, limit?: number) {
        if ((page === undefined) !== (limit === undefined)) {
            throw new BadRequestException('page and limit must be provided together');
        }
        if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
            throw new BadRequestException('page must be a positive integer');
        }
        if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
            throw new BadRequestException('limit must be an integer between 1 and 100');
        }

        const currentPage = page ?? 1;
        const pageSize = limit ?? 10;
        const offset = (currentPage - 1) * pageSize;

        let query = `
          SELECT exam_type_id, exam_type
          FROM exam_types
          WHERE status = 1
          ORDER BY exam_type_id ASC
        `;

        const params: any[] = [];

        if (page !== undefined && limit !== undefined) {
            query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(pageSize, offset);
        }

        const data = await this.dataSource.query(query, params);

        const totalResult = await this.dataSource.query(
            `SELECT COUNT(*) as count FROM exam_types WHERE status = 1`,
        );
        const totalRecords = Number(totalResult[0].count);

        return {
            status: true,
            message: 'Exam types fetched successfully',
            data,
            totalRecords,
            totalPages: page !== undefined && limit !== undefined ? Math.ceil(totalRecords / pageSize) : 1,
        };
    }

    // GET BY ID
    async findOne(id: number) {
        if (!Number.isInteger(id) || id < 1) {
            throw new BadRequestException('exam_type_id must be a positive integer');
        }   

        const result = await this.dataSource.query(
            `
          SELECT exam_type_id, exam_type, status, created_at, updated_at
          FROM exam_types
          WHERE exam_type_id = $1 AND status = 1
          LIMIT 1
          `,
            [id],
        );

        if (result.length === 0) {
            throw new NotFoundException('Exam type not found');
        }

        return {
            status: true,
            message: 'Exam type fetched successfully',
            data: result[0],
        };
    }

    // UPDATE
    async update(id: number, exam_type: string) {
        if (!Number.isInteger(id) || id < 1) {
            throw new BadRequestException('exam_type_id must be a positive integer');
        }

        if (!exam_type || exam_type.trim() === '') {
            throw new BadRequestException('Exam type name is required');
        }

        const trimmedName = exam_type.trim();

        const exists = await this.dataSource.query(
            `SELECT exam_type_id FROM exam_types WHERE exam_type_id = $1 AND status = 1 LIMIT 1`,
            [id],
        );

        if (exists.length === 0) {
            throw new NotFoundException('Exam type not found');
        }

        const duplicate = await this.dataSource.query(
            `SELECT exam_type_id FROM exam_types 
           WHERE LOWER(exam_type) = LOWER($1) AND exam_type_id != $2 AND status = 1 LIMIT 1`,
            [trimmedName, id],
        );

        if (duplicate.length > 0) {
            throw new BadRequestException('Exam type name already exists');
        }

        const result = await this.dataSource.query(
            `
          UPDATE exam_types
          SET exam_type = $1,
              updated_at = NOW()
          WHERE exam_type_id = $2
          RETURNING exam_type_id, exam_type, status, created_at, updated_at
          `,
            [trimmedName, id],
        );

        return {
            status: true,
            message: 'Exam type updated successfully',
            data: result[0],
        };
    }

    // SOFT DELETE
    async remove(id: number) {
        if (!Number.isInteger(id) || id < 1) {
            throw new BadRequestException('exam_type_id must be a positive integer');
        }

        const exists = await this.dataSource.query(
            `SELECT exam_type_id FROM exam_types WHERE exam_type_id = $1 AND status = 1 LIMIT 1`,
            [id],
        );

        if (exists.length === 0) {
            throw new NotFoundException('Exam type not found');
        }

        await this.dataSource.query(
            `UPDATE exam_types SET status = 0, updated_at = NOW() WHERE exam_type_id = $1`,
            [id],
        );

        return {
            status: true,
            message: 'Exam type deleted successfully',
        };
    }
}

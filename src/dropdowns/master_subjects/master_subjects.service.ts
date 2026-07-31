import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MasterSubjectsService {
    constructor(@InjectDataSource() private dataSource: DataSource) { }

    async create(subject_name: string) {
        if (!subject_name || subject_name.trim() === '') {
            throw new ConflictException('Subject name is required');
        }

        const trimmedName = subject_name.trim();

        const exists = await this.dataSource.query(
            `SELECT id FROM master_subjects WHERE LOWER(subject_name) = LOWER($1) AND status = 1 LIMIT 1`,
            [trimmedName],
        );

        if (exists.length > 0) {
            throw new ConflictException('Subject with this name already exists');
        }

        const result = await this.dataSource.query(
            `INSERT INTO master_subjects (subject_name, status, created_at, updated_at) VALUES ($1, 1, NOW(), NOW()) RETURNING id, subject_name`,
            [trimmedName],
        );

        return {
            status: true,
            message: 'Subject Added successfully',
            data: result[0],
        };
    }

    async findAll() {
        const data = await this.dataSource.query(
            `SELECT id, subject_name 
     FROM master_subjects 
     WHERE status = 1 
     ORDER BY id ASC`,
        );

        return {
            status: true,
            message: 'All Subjects fetched successfully',
            data: data,
        };
    }

    async findOne(id: number) {
        if (!id) {
            throw new BadRequestException('id is required');
        }

        const result = await this.dataSource.query(
            `SELECT id, subject_name 
       FROM master_subjects 
       WHERE id = $1 AND status = 1 
       LIMIT 1`,
            [id],
        );

        if (result.length === 0) {
            throw new NotFoundException('Subject not found');
        }

        return {
            status: true,
            message: 'Subject by id fetched successfully',
            data: result[0],
        };
    }

    async update(id: number, subject_name: string) {
        if (!id) {
            throw new BadRequestException('id is required');
        }

        if (!subject_name || subject_name.trim() === '') {
            throw new ConflictException('Subject name is required');
        }

        const trimmedName = subject_name.trim();

        // Check if exists and active
        const subject = await this.dataSource.query(
            `SELECT id FROM master_subjects WHERE id = $1 AND status = 1 LIMIT 1`,
            [id],
        );

        if (subject.length === 0) {
            throw new NotFoundException('Subject not found');
        }

        const duplicate = await this.dataSource.query(
            `SELECT id FROM master_subjects 
       WHERE LOWER(subject_name) = LOWER($1) 
         AND status = 1 
         AND id != $2 
       LIMIT 1`,
            [trimmedName, id],
        );

        if (duplicate.length > 0) {
            throw new ConflictException('Subject with this name already exists');
        }

        await this.dataSource.query(
            `UPDATE master_subjects 
       SET subject_name = $1, updated_at = NOW() 
       WHERE id = $2`,
            [trimmedName, id],
        );

        return {
            status: true,
            message: 'Subject Updated successfully',
        };
    }

    async remove(id: number) {
        if (!id) {
            throw new BadRequestException('id is required');
        }

        const subject = await this.dataSource.query(
            `SELECT id FROM master_subjects WHERE id = $1 AND status = 1 LIMIT 1`,
            [id],
        );

        if (subject.length === 0) {
            throw new NotFoundException('Subject not found');
        }

        await this.dataSource.query(
            `UPDATE master_subjects SET status = 0, updated_at = NOW() WHERE id = $1`,
            [id],
        );

        return {
            status: true,
            message: 'Subject deleted successfully',
        };
    }
}

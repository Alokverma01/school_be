import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CertificateTypeService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  // CREATE
  async create(certificate_name: string) {
    if (!certificate_name || certificate_name.trim() === '') {
      throw new BadRequestException('Certificate name is required');
    }

    const trimmedName = certificate_name.trim();

    const exists = await this.dataSource.query(
      `SELECT certificate_type_id FROM certificate_types WHERE LOWER(certificate_name) = LOWER($1) AND status = 1 LIMIT 1`,
      [trimmedName],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Certificate type already exists');
    }

    const result = await this.dataSource.query(
      `INSERT INTO certificate_types (certificate_name, status, created_at, updated_at)
       VALUES ($1, 1, NOW(), NOW())
       RETURNING certificate_type_id, certificate_name, status`,
      [trimmedName],
    );

    return {
      status: true,
      message: 'Certificate type created successfully',
      data: result[0],
    };
  }

  // GET ALL (with pagination)
  async findAll(page?: number, limit?: number) {
    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const offset = (currentPage - 1) * pageSize;

    let query = `
      SELECT certificate_type_id, certificate_name
      FROM certificate_types
      WHERE status = 1
      ORDER BY certificate_type_id ASC
    `;

    const params: any[] = [];

    if (page && limit) {
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(pageSize, offset);
    }

    const data = await this.dataSource.query(query, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM certificate_types WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Certificate types fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / pageSize) : 1,
    };
  }

  // GET BY ID
  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('certificate_type_id is required');
    }

    const result = await this.dataSource.query(
      `
      SELECT certificate_type_id, certificate_name
      FROM certificate_types
      WHERE certificate_type_id = $1 AND status = 1
      LIMIT 1
      `,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Certificate type not found');
    }

    return {
      status: true,
      message: 'Certificate type fetched successfully',
      data: result[0],
    };
  }

  // UPDATE
  async update(id: number, certificate_name: string, status?: number) {
    if (!id) {
      throw new BadRequestException('certificate_type_id is required');
    }

    if (!certificate_name || certificate_name.trim() === '') {
      throw new BadRequestException('Certificate name is required');
    }

    const trimmedName = certificate_name.trim();

    const exists = await this.dataSource.query(
      `SELECT certificate_type_id FROM certificate_types WHERE certificate_type_id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Certificate type not found');
    }

    const duplicate = await this.dataSource.query(
      `SELECT certificate_type_id FROM certificate_types 
       WHERE LOWER(certificate_name) = LOWER($1) AND certificate_type_id != $2 AND status = 1 LIMIT 1`,
      [trimmedName, id],
    );

    if (duplicate.length > 0) {
      throw new BadRequestException('Certificate type name already exists');
    }

    await this.dataSource.query(
      `
      UPDATE certificate_types
      SET certificate_name = $1,
          status = $2,
          updated_at = NOW()
      WHERE certificate_type_id = $3
      `,
      [trimmedName, status ?? 1, id],
    );

    return {
      status: true,
      message: 'Certificate type updated successfully',
    };
  }

  // SOFT DELETE
  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('certificate_type_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT certificate_type_id FROM certificate_types WHERE certificate_type_id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Certificate type not found');
    }

    await this.dataSource.query(
      `UPDATE certificate_types SET status = 0, updated_at = NOW() WHERE certificate_type_id = $1`,
      [id],
    );

    return {
      status: true,
      message: 'Certificate type deleted successfully',
    };
  }
}
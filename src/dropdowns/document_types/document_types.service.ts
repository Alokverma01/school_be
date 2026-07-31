import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DocumentTypeService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  // CREATE
  async create(document_name: string) {
    if (!document_name || document_name.trim() === '') {
      throw new BadRequestException('Document name is required');
    }

    const trimmedName = document_name.trim();

    // Check duplicate
    const exists = await this.dataSource.query(
      `SELECT document_type_id FROM document_types WHERE LOWER(document_name) = LOWER($1) AND status = 1 LIMIT 1`,
      [trimmedName],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Document type already exists');
    }

    const result = await this.dataSource.query(
      `INSERT INTO document_types (document_name, status, created_at, updated_at)
       VALUES ($1, 1, NOW(), NOW())
       RETURNING document_type_id, document_name, status`,
      [trimmedName],
    );

    return {
      status: true,
      message: 'Document type created successfully',
    };
  }

  // GET ALL (with pagination)
  async findAll(page?: number, limit?: number) {
    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const offset = (currentPage - 1) * pageSize;

    let query = `
      SELECT document_type_id, document_name
      FROM document_types
      WHERE status = 1
      ORDER BY document_type_id ASC
    `;

    let params: any[] = [];

    if (page && limit) {
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(pageSize, offset);
    }

    const data = await this.dataSource.query(query, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM document_types WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Document types fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / pageSize) : 1,
    };
  }

  // GET BY ID
  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('document_type_id is required');
    }

    const result = await this.dataSource.query(
      `
      SELECT document_type_id, document_name
      FROM document_types
      WHERE document_type_id = $1 AND status = 1
      LIMIT 1
      `,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Document type not found');
    }

    return {
      status: true,
      message: 'Document type fetched successfully',
      data: result[0],
    };
  }

  // UPDATE
  async update(id: number, document_name: string, status?: number) {
    if (!id) {
      throw new BadRequestException('document_type_id is required');
    }

    if (!document_name || document_name.trim() === '') {
      throw new BadRequestException('Document name is required');
    }

    const trimmedName = document_name.trim();

    // Check existence
    const exists = await this.dataSource.query(
      `SELECT document_type_id FROM document_types WHERE document_type_id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Document type not found');
    }

    // Check duplicate name (excluding current)
    const duplicate = await this.dataSource.query(
      `SELECT document_type_id FROM document_types 
       WHERE LOWER(document_name) = LOWER($1) AND document_type_id != $2 AND status = 1 LIMIT 1`,
      [trimmedName, id],
    );

    if (duplicate.length > 0) {
      throw new BadRequestException('Document type name already exists');
    }

    await this.dataSource.query(
      `
      UPDATE document_types
      SET document_name = $1,
          status = $2,
          updated_at = NOW()
      WHERE document_type_id = $3
      `,
      [trimmedName, status ?? 1, id],
    );

    return {
      status: true,
      message: 'Document type updated successfully',
    };
  }

  // SOFT DELETE
  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('document_type_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT document_type_id FROM document_types WHERE document_type_id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Document type not found');
    }

    await this.dataSource.query(
      `UPDATE document_types SET status = 0, updated_at = NOW() WHERE document_type_id = $1`,
      [id],
    );

    return {
      status: true,
      message: 'Document type deleted successfully',
    };
  }
}
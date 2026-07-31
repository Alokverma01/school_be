// src/asset-category/asset-category.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AssetCategoryService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  // CREATE
  async create(category_name: string) {
    if (!category_name || category_name.trim() === '') {
      throw new BadRequestException('Category name is required');
    }

    const trimmedName = category_name.trim();

    // Check for duplicate
    const exists = await this.dataSource.query(
      `SELECT category_id FROM asset_categories WHERE LOWER(category_name) = LOWER($1) AND status = 1 LIMIT 1`,
      [trimmedName],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Asset category already exists');
    }

    const result = await this.dataSource.query(
      `INSERT INTO asset_categories (category_name, status, created_at, updated_at)
       VALUES ($1, 1, NOW(), NOW())
       RETURNING category_id, category_name, status`,
      [trimmedName],
    );

    return {
      status: true,
      message: 'Asset category created successfully',
      data: result[0],
    };
  }

  // GET ALL (with pagination)
  async findAll(page?: number, limit?: number) {
    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const offset = (currentPage - 1) * pageSize;

    let query = `
      SELECT category_id, category_name
      FROM asset_categories
      WHERE status = 1
      ORDER BY category_id ASC
    `;

    const params: any[] = [];

    if (page && limit) {
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(pageSize, offset);
    }

    const data = await this.dataSource.query(query, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM asset_categories WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Asset categories fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / pageSize) : 1,
    };
  }

  // GET BY ID
  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('category_id is required');
    }

    const result = await this.dataSource.query(
      `
      SELECT category_id, category_name
      FROM asset_categories
      WHERE category_id = $1 AND status = 1
      LIMIT 1
      `,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Asset category not found');
    }

    return {
      status: true,
      message: 'Asset category fetched successfully',
      data: result[0],
    };
  }

  // UPDATE
  async update(id: number, category_name: string, status?: number) {
    if (!id) {
      throw new BadRequestException('category_id is required');
    }

    if (!category_name || category_name.trim() === '') {
      throw new BadRequestException('Category name is required');
    }

    const trimmedName = category_name.trim();

    // Check if exists
    const exists = await this.dataSource.query(
      `SELECT category_id FROM asset_categories WHERE category_id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Asset category not found');
    }

    // Check duplicate name
    const duplicate = await this.dataSource.query(
      `SELECT category_id FROM asset_categories 
       WHERE LOWER(category_name) = LOWER($1) AND category_id != $2 AND status = 1 LIMIT 1`,
      [trimmedName, id],
    );

    if (duplicate.length > 0) {
      throw new BadRequestException('Asset category name already exists');
    }

    await this.dataSource.query(
      `
      UPDATE asset_categories
      SET category_name = $1,
          status = $2,
          updated_at = NOW()
      WHERE category_id = $3
      `,
      [trimmedName, status ?? 1, id],
    );

    return {
      status: true,
      message: 'Asset category updated successfully',
    };
  }

  // SOFT DELETE
  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('category_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT category_id FROM asset_categories WHERE category_id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Asset category not found');
    }

    await this.dataSource.query(
      `UPDATE asset_categories SET status = 0, updated_at = NOW() WHERE category_id = $1`,
      [id],
    );

    return {
      status: true,
      message: 'Asset category deleted successfully',
    };
  }
}
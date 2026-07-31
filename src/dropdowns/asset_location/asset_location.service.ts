import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AssetLocationService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(location_name: string) {
    const trimmed = location_name.trim();
    if (!trimmed) throw new BadRequestException('Location name is required');

    const exists = await this.dataSource.query(
      `SELECT location_id FROM asset_locations WHERE LOWER(location_name) = LOWER($1) AND status = 1 LIMIT 1`,
      [trimmed],
    );

    if (exists.length > 0) throw new BadRequestException('Location already exists');

    const result = await this.dataSource.query(
      `INSERT INTO asset_locations (location_name, status, created_at, updated_at)
       VALUES ($1, 1, NOW(), NOW())
       RETURNING location_id, location_name, status`,
      [trimmed],
    );

    return { status: true, message: 'Location created successfully', data: result[0] };
  }

  async findAll(page?: number, limit?: number) {
    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const offset = (currentPage - 1) * pageSize;

    let query = `SELECT location_id, location_name FROM asset_locations WHERE status = 1 ORDER BY location_id ASC`;
    const params: any[] = [];

    if (page && limit) {
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(pageSize, offset);
    }

    const data = await this.dataSource.query(query, params);

    const total = await this.dataSource.query(`SELECT COUNT(*) as count FROM asset_locations WHERE status = 1`);
    const totalRecords = Number(total[0].count);

    return {
      status: true,
      message: 'Locations fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / pageSize) : 1,
    };
  }

  async findOne(id: number) {
    const result = await this.dataSource.query(
      `SELECT location_id, location_name, status FROM asset_locations WHERE location_id = $1 AND status = 1`,
      [id],
    );

    if (result.length === 0) throw new NotFoundException('Location not found');

    return { status: true, message: 'Location fetched successfully', data: result[0] };
  }

  async update(id: number, location_name: string, status?: number) {
    const exists = await this.dataSource.query(
      `SELECT location_id FROM asset_locations WHERE location_id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) throw new NotFoundException('Location not found');

    const duplicate = await this.dataSource.query(
      `SELECT location_id FROM asset_locations WHERE LOWER(location_name) = LOWER($1) AND location_id != $2 AND status = 1`,
      [location_name.trim(), id],
    );

    if (duplicate.length > 0) throw new BadRequestException('Location name already exists');

    await this.dataSource.query(
      `UPDATE asset_locations SET location_name = $1, status = $2, updated_at = NOW() WHERE location_id = $3`,
      [location_name.trim(), status ?? 1, id],
    );

    return { status: true, message: 'Location updated successfully' };
  }

  async remove(id: number) {
    const exists = await this.dataSource.query(
      `SELECT location_id FROM asset_locations WHERE location_id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) throw new NotFoundException('Location not found');

    await this.dataSource.query(`UPDATE asset_locations SET status = 0, updated_at = NOW() WHERE location_id = $1`, [id]);

    return { status: true, message: 'Location deleted successfully' };
  }
}
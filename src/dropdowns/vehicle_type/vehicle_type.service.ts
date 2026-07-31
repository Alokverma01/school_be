import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class VehicleTypeService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  // CREATE
  async create(vehicle_type: string) {
    if (!vehicle_type || vehicle_type.trim() === '') {
      throw new BadRequestException('Vehicle type name is required');
    }

    const trimmedName = vehicle_type.trim();

    const exists = await this.dataSource.query(
      `SELECT vehicle_type_id FROM vehicle_types WHERE LOWER(vehicle_type) = LOWER($1) AND status = 1 LIMIT 1`,
      [trimmedName],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Vehicle type already exists');
    }

    const result = await this.dataSource.query(
      `INSERT INTO vehicle_types (vehicle_type, status, created_at, updated_at)
       VALUES ($1, 1, NOW(), NOW())
       RETURNING vehicle_type_id, vehicle_type, status`,
      [trimmedName],
    );

    return {
      status: true,
      message: 'Vehicle type created successfully',
      data: result[0],
    };
  }

  // GET ALL (with pagination)
  async findAll(page?: number, limit?: number) {
    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const offset = (currentPage - 1) * pageSize;

    let query = `
      SELECT vehicle_type_id, vehicle_type
      FROM vehicle_types
      WHERE status = 1
      ORDER BY vehicle_type_id ASC
    `;

    const params: any[] = [];

    if (page && limit) {
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(pageSize, offset);
    }

    const data = await this.dataSource.query(query, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM vehicle_types WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Vehicle types fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / pageSize) : 1,
    };
  }

  // GET BY ID
  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('vehicle_type_id is required');
    }

    const result = await this.dataSource.query(
      `
      SELECT vehicle_type_id, vehicle_type, status, created_at, updated_at
      FROM vehicle_types
      WHERE vehicle_type_id = $1 AND status = 1
      LIMIT 1
      `,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Vehicle type not found');
    }

    return {
      status: true,
      message: 'Vehicle type fetched successfully',
      data: result[0],
    };
  }

  // UPDATE
  async update(id: number, vehicle_type: string) {
    if (!id) {
      throw new BadRequestException('vehicle_type_id is required');
    }

    if (!vehicle_type || vehicle_type.trim() === '') {
      throw new BadRequestException('Vehicle type name is required');
    }

    const trimmedName = vehicle_type.trim();

    const exists = await this.dataSource.query(
      `SELECT vehicle_type_id FROM vehicle_types WHERE vehicle_type_id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Vehicle type not found');
    }

    const duplicate = await this.dataSource.query(
      `SELECT vehicle_type_id FROM vehicle_types 
       WHERE LOWER(vehicle_type) = LOWER($1) AND vehicle_type_id != $2 AND status = 1 LIMIT 1`,
      [trimmedName, id],
    );

    if (duplicate.length > 0) {
      throw new BadRequestException('Vehicle type name already exists');
    }

    await this.dataSource.query(
      `
      UPDATE vehicle_types
      SET vehicle_type = $1,
          status = $2,
          updated_at = NOW()
      WHERE vehicle_type_id = $3
      `,
      [trimmedName, status ?? 1, id],
    );

    return {
      status: true,
      message: 'Vehicle type updated successfully',
    };
  }

  // SOFT DELETE
  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('vehicle_type_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT vehicle_type_id FROM vehicle_types WHERE vehicle_type_id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Vehicle type not found');
    }

    await this.dataSource.query(
      `UPDATE vehicle_types SET status = 0, updated_at = NOW() WHERE vehicle_type_id = $1`,
      [id],
    );

    return {
      status: true,
      message: 'Vehicle type deleted successfully',
    };
  }
}
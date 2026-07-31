import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class FeesTypesService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(name: string) {
    if (!name || name.trim() === '') {
      throw new ConflictException('Name is required');
    }

    const trimmedName = name.trim();

    const exists = await this.dataSource.query(
      `SELECT id FROM fees_types WHERE LOWER(name) = LOWER($1) AND status = 1 LIMIT 1`,
      [trimmedName],
    );

    if (exists.length > 0) {
      throw new ConflictException('Fee Type with this name already exists');
    }

    const result = await this.dataSource.query(
      `INSERT INTO fees_types (name, status) VALUES ($1, 1) RETURNING id, name`,
      [trimmedName],
    );

    return {
      status: true,
      message: 'Fee Type Added successfully',
    };
  }

  async findAll() {
    const data = await this.dataSource.query(
      `SELECT id, name 
     FROM fees_types 
     WHERE status = 1 
     ORDER BY id ASC`,
    );

    return {
      status: true,
      message: 'All Fees Types fetched successfully',
      data: data,
    };
  }

  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    const result = await this.dataSource.query(
      `SELECT id, name 
       FROM fee_types 
       WHERE id = $1 AND status = 1 
       LIMIT 1`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Fee type not found');
    }

    return {
      status: true,
      message: 'Fee type by id fetched successfully',
      data: result[0],
    };
  }

  async update(id: number, name: string) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    if (!name || name.trim() === '') {
      throw new ConflictException('Name is required');
    }

    const trimmedName = name.trim();

    // Check if exists and active
    const degree = await this.dataSource.query(
      `SELECT id FROM fees_types WHERE id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (degree.length === 0) {
      throw new NotFoundException('Fee Type not found');
    }

    const duplicate = await this.dataSource.query(
      `SELECT id FROM fee_type 
       WHERE LOWER(name) = LOWER($1) 
         AND status = 1 
         AND id != $2 
       LIMIT 1`,
      [trimmedName, id],
    );

    if (duplicate.length > 0) {
      throw new ConflictException('Fees Type with this name already exists');
    }

    const result = await this.dataSource.query(
      `UPDATE fees_types 
       SET name = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, name`,
      [trimmedName, id],
    );

    return {
      status: true,
      message: 'Fees Type Updated successfully',
    };
  }

  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    const degree = await this.dataSource.query(
      `SELECT id FROM fees_types WHERE id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (degree.length === 0) {
      throw new NotFoundException('Fee Type not found');
    }

    await this.dataSource.query(
      `UPDATE fees_types SET status = 0, updated_at = NOW() WHERE id = $1`,
      [id],
    );

    return {
      status: true,
      message: 'Fee Type deleted successfully',
    };
  }
}

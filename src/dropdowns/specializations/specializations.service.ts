import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SpecializationsService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(name: string) {
    if (!name || name.trim() === '') {
      throw new ConflictException('Name is required');
    }

    const trimmedName = name.trim();

    const exists = await this.dataSource.query(
      `SELECT id FROM specializations WHERE LOWER(name) = LOWER($1) AND status = 1 LIMIT 1`,
      [trimmedName],
    );

    if (exists.length > 0) {
      throw new ConflictException(
        'Specialization with this name already exists',
      );
    }

    await this.dataSource.query(
      `INSERT INTO specializations (name, status) VALUES ($1, 1)`,
      [trimmedName],
    );

    return {
      status: true,
      message: 'Specialization Added successfully',
    };
  }

  async findAll() {
    const data = await this.dataSource.query(
      `SELECT id, name 
       FROM specializations 
       WHERE status = 1 
       ORDER BY id ASC`,
    );

    return {
      status: true,
      message: 'All Specializations fetched successfully',
      data: data,
    };
  }

  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    const result = await this.dataSource.query(
      `SELECT id, name 
       FROM specializations 
       WHERE id = $1 AND status = 1 
       LIMIT 1`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Specialization not found');
    }

    return {
      status: true,
      message: 'Specialization by id fetched successfully',
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

    const spec = await this.dataSource.query(
      `SELECT id FROM specializations WHERE id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (spec.length === 0) {
      throw new NotFoundException('Specialization not found');
    }

    const duplicate = await this.dataSource.query(
      `SELECT id FROM specializations 
       WHERE LOWER(name) = LOWER($1) 
         AND status = 1 
         AND id != $2 
       LIMIT 1`,
      [trimmedName, id],
    );

    if (duplicate.length > 0) {
      throw new ConflictException(
        'Specialization with this name already exists',
      );
    }

    await this.dataSource.query(
      `UPDATE specializations 
       SET name = $1, updated_at = NOW() 
       WHERE id = $2`,
      [trimmedName, id],
    );

    return {
      status: true,
      message: 'Specialization Updated successfully',
    };
  }

  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    const spec = await this.dataSource.query(
      `SELECT id FROM specializations WHERE id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (spec.length === 0) {
      throw new NotFoundException('Specialization not found');
    }

    await this.dataSource.query(
      `UPDATE specializations SET status = 0, updated_at = NOW() WHERE id = $1`,
      [id],
    );

    return {
      status: true,
      message: 'Specialization deleted successfully',
    };
  }
}

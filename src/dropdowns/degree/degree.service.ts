import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DegreeService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(name: string) {
    if (!name || name.trim() === '') {
      throw new ConflictException('Name is required');
    }

    const trimmedName = name.trim();

    const exists = await this.dataSource.query(
      `SELECT id FROM degrees WHERE LOWER(name) = LOWER($1) AND status = 1 LIMIT 1`,
      [trimmedName],
    );

    if (exists.length > 0) {
      throw new ConflictException('Degree with this name already exists');
    }

    const result = await this.dataSource.query(
      `INSERT INTO degrees (name, status) VALUES ($1, 1) RETURNING id, name`,
      [trimmedName],
    );

    return {
      status: true,
      message: 'Degree Added successfully',
    };
  }

  async findAll() {
    const data = await this.dataSource.query(
      `SELECT id, name 
     FROM degrees 
     WHERE status = 1 
     ORDER BY id ASC`,
    );

    return {
      status: true,
      message: 'All Degree fetched successfully',
      data: data,
    };
  }

  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    const result = await this.dataSource.query(
      `SELECT id, name 
       FROM degrees 
       WHERE id = $1 AND status = 1 
       LIMIT 1`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Degree not found');
    }

    return {
      status: true,
      message: 'Degree by id fetched successfully',
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
      `SELECT id FROM degrees WHERE id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (degree.length === 0) {
      throw new NotFoundException('Degree not found');
    }

    const duplicate = await this.dataSource.query(
      `SELECT id FROM degrees 
       WHERE LOWER(name) = LOWER($1) 
         AND status = 1 
         AND id != $2 
       LIMIT 1`,
      [trimmedName, id],
    );

    if (duplicate.length > 0) {
      throw new ConflictException('Degree with this name already exists');
    }

    const result = await this.dataSource.query(
      `UPDATE degrees 
       SET name = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, name`,
      [trimmedName, id],
    );

    return {
      status: true,
      message: 'Degree Updated successfully',
    };
  }

  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    const degree = await this.dataSource.query(
      `SELECT id FROM degrees WHERE id = $1 AND status = 1 LIMIT 1`,
      [id],
    );

    if (degree.length === 0) {
      throw new NotFoundException('Degree not found');
    }

    await this.dataSource.query(
      `UPDATE degrees SET status = 0, updated_at = NOW() WHERE id = $1`,
      [id],
    );

    return {
      status: true,
      message: 'Degree deleted successfully',
    };
  }
}

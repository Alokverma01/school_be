// src/payments-modes/payments-modes.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PaymentsModesService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(payment_mode: string) {
    if (!payment_mode || payment_mode.trim() === '') {
      throw new BadRequestException('Payment mode name is required');
    }

    const trimmedName = payment_mode.trim();

    const exists = await this.dataSource.query(
      `SELECT payment_mode_id FROM payments_modes 
       WHERE LOWER(payment_mode) = LOWER($1) AND status = 1 
       LIMIT 1`,
      [trimmedName],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Payment mode already exists');
    }

    await this.dataSource.query(
      `INSERT INTO payments_modes (payment_mode, status, created_at, updated_at)
       VALUES ($1, 1, NOW(), NOW())`,
      [trimmedName],
    );

    return {
      status: true,
      message: 'Payment mode created successfully',
    };
  }

  async findAll(page?: number, limit?: number) {
    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const offset = (currentPage - 1) * pageSize;

    let query = `
      SELECT payment_mode_id, payment_mode
      FROM payments_modes
      WHERE status = 1
      ORDER BY payment_mode_id ASC
    `;

    const params: any[] = [];

    if (page && limit) {
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(pageSize, offset);
    }

    const data = await this.dataSource.query(query, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM payments_modes WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Payment modes fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / pageSize) : 1,
      currentPage,
      pageSize,
    };
  }

  async findOne(id: number) {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid payment_mode_id is required');
    }

    const result = await this.dataSource.query(
      `
      SELECT payment_mode_id, payment_mode
      FROM payments_modes
      WHERE payment_mode_id = $1 AND status = 1
      LIMIT 1
      `,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Payment mode not found');
    }

    return {
      status: true,
      message: 'Payment mode fetched successfully',
      data: result[0],
    };
  }

  async update(id: number, payment_mode: string) {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid payment_mode_id is required');
    }

    if (!payment_mode || payment_mode.trim() === '') {
      throw new BadRequestException('Payment mode name is required');
    }

    const trimmedName = payment_mode.trim();

    // Check if exists
    const exists = await this.dataSource.query(
      `SELECT payment_mode_id FROM payments_modes WHERE payment_mode_id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Payment mode not found');
    }

    // Check duplicate
    const duplicate = await this.dataSource.query(
      `SELECT payment_mode_id FROM payments_modes 
       WHERE LOWER(payment_mode) = LOWER($1) AND payment_mode_id != $2 AND status = 1`,
      [trimmedName, id],
    );

    if (duplicate.length > 0) {
      throw new BadRequestException('Payment mode already exists');
    }

    await this.dataSource.query(
      `
      UPDATE payments_modes
      SET payment_mode = $1,
          updated_at = NOW()
      WHERE payment_mode_id = $2
      `,
      [trimmedName, id],
    );

    return {
      status: true,
      message: 'Payment mode updated successfully',
    };
  }

  async remove(id: number) {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid payment_mode_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT payment_mode_id FROM payments_modes WHERE payment_mode_id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Payment mode not found');
    }

    await this.dataSource.query(
      `UPDATE payments_modes SET status = 0, updated_at = NOW() WHERE payment_mode_id = $1`,
      [id],
    );

    return {
      status: true,
      message: 'Payment mode deleted successfully',
    };
  }
}
import { Holiday } from './holidays.entity';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { CreateHolidayDto } from './holidays.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class HolidaysService {
  constructor(private readonly dataSource: DataSource) {}

  async create(dto: CreateHolidayDto) {
    const exists = await this.dataSource.query(
      `
    SELECT holiday_id 
    FROM holidays 
    WHERE date = $1 AND status = 1
    `,
      [dto.date],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Holiday already exists for this date');
    }

    const query = `
    INSERT INTO holidays
    (holiday_name, date, category, description, status)
    VALUES ($1, $2, $3, $4, 1)
  `;

    await this.dataSource.query(query, [
      dto.holiday_name,
      dto.date,
      dto.category,
      dto.description ?? null,
    ]);

    return {
      status: true,
      message: 'Holiday created successfully',
    };
  }

  async findAll(page?: string, limit?: string) {
    let baseQuery = `
    SELECT holiday_id, holiday_name, date, category, description
    FROM holidays
    WHERE status = 1
    ORDER BY date ASC
    `;

    // If pagination NOT provided → return all
    if (!page || !limit) {
      const holidays = await this.dataSource.query(baseQuery);
      return {
        status: true,
        message: 'Holidays fetched successfully',
        data: holidays,
        totalRecords: holidays.length,
      };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    // Paginated query
    const paginatedQuery = baseQuery + ` LIMIT $1 OFFSET $2`;
    const holidays = await this.dataSource.query(paginatedQuery, [
      limitNum,
      offset,
    ]);

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM holidays WHERE status = 1`,
    );
    const totalRecords = Number(countResult[0].count);

    return {
      status: true,
      message: 'Holidays fetched successfully',
      data: holidays,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      currentPage: pageNum,
    };
  }

  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    const result = await this.dataSource.query(
      `SELECT 
      holiday_id,holiday_name,date,category,description 
      FROM holidays WHERE holiday_id = $1 AND status = 1`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Holiday not found');
    }

    return {
      status: true,
      message: 'Holiday fetched successfully',
      data: result[0],
    };
  }

  async updateHoliday(holiday_id: number, dto: any) {
    if (!holiday_id) {
      throw new BadRequestException('holiday_id is required');
    }

    // Check holiday exists
    const exists = await this.dataSource.query(
      `SELECT holiday_id FROM holidays WHERE holiday_id = $1 AND status = 1`,
      [holiday_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Holiday not found');
    }

    // Prevent duplicate holiday (same name + date)
    const duplicate = await this.dataSource.query(
      `
    SELECT holiday_id FROM holidays
    WHERE holiday_name = $1 
      AND date = $2
      AND holiday_id != $3
      AND status = 1
    `,
      [dto.holiday_name, dto.date, holiday_id],
    );

    if (duplicate.length > 0) {
      throw new BadRequestException('Holiday already exists for this date');
    }

    await this.dataSource.query(
      `
    UPDATE holidays
    SET
      holiday_name = $1,
      date = $2,
      category = $3,
      description = $4,
      updated_at = NOW()
    WHERE holiday_id = $5
    `,
      [
        dto.holiday_name,
        dto.date,
        dto.category,
        dto.description ?? null,
        holiday_id,
      ],
    );

    return {
      status: true,
      message: 'Holiday updated successfully',
    };
  }

  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    // Check holiday exists
    const exists = await this.dataSource.query(
      `SELECT holiday_id FROM holidays WHERE holiday_id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Holiday not found');
    }

    const query = `
      UPDATE holidays
      SET status = 0, updated_at = $1
      WHERE holiday_id = $2 AND status = 1
      RETURNING *
    `;
    const values = [new Date(), id];

    const result = await this.dataSource.query(query, values);

    if (result.length === 0) {
      throw new NotFoundException('Holiday not found');
    }

    return {
      status: true,
      message: 'Holiday deleted successfully',
    };
  }
}

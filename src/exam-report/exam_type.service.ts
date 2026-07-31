import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateExamTypeDto } from './exam-report.dto';

@Injectable()
export class ExamTypeService {
  constructor(private readonly dataSource: DataSource) {}

  // ===================== CREATE =====================

  async createExamType(dto: CreateExamTypeDto) {
    const duplicate = await this.dataSource.query(
      `
      SELECT exam_type_id
      FROM exam_types
      WHERE LOWER(exam_type)=LOWER($1)
      AND status=1
      `,
      [dto.exam_type],
    );

    if (duplicate.length > 0) {
      throw new BadRequestException('Exam Type already exists');
    }

    const result = await this.dataSource.query(
      `
      INSERT INTO exam_types
      (exam_type)
      VALUES ($1)
      RETURNING *
      `,
      [dto.exam_type],
    );

    return {
      status: true,
      message: 'Exam Type created successfully',
      data: result[0],
    };
  }

  // ===================== UPDATE =====================

  async updateExamType(
    exam_type_id: number,
    dto: CreateExamTypeDto,
  ) {
    const exists = await this.dataSource.query(
      `
      SELECT *
      FROM exam_types
      WHERE exam_type_id=$1
      AND status=1
      `,
      [exam_type_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Exam Type not found');
    }

    const duplicate = await this.dataSource.query(
      `
      SELECT exam_type_id
      FROM exam_types
      WHERE LOWER(exam_type)=LOWER($1)
      AND exam_type_id<>$2
      AND status=1
      `,
      [dto.exam_type, exam_type_id],
    );

    if (duplicate.length > 0) {
      throw new BadRequestException('Exam Type already exists');
    }

    const result = await this.dataSource.query(
      `
      UPDATE exam_types
      SET
        exam_type=$1,
        updated_at=NOW()
      WHERE exam_type_id=$2
      RETURNING *
      `,
      [dto.exam_type, exam_type_id],
    );

    return {
      status: true,
      message: 'Exam Type updated successfully',
      data: result[0],
    };
  }

  // ===================== GET BY ID =====================

  async getExamTypeById(exam_type_id: number) {
    const result = await this.dataSource.query(
      `
      SELECT *
      FROM exam_types
      WHERE exam_type_id=$1
      AND status=1
      `,
      [exam_type_id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Exam Type not found');
    }

    return {
      status: true,
      message: 'Exam Type fetched successfully',
      data: result[0],
    };
  }

  // ===================== GET ALL =====================

  async getAllExamTypes(
    page?: number,
    limit?: number,
  ) {
    let query = `
      SELECT *
      FROM exam_types
      WHERE status=1
      ORDER BY exam_type_id DESC
    `;

    if (!page || !limit) {
      const result = await this.dataSource.query(query);

      return {
        status: true,
        message: 'Exam Types fetched successfully',
        data: result,
        totalRecords: result.length,
      };
    }

    const offset = (page - 1) * limit;

    const total = await this.dataSource.query(
      `
      SELECT COUNT(*) FROM exam_types
      WHERE status=1
      `,
    );

    query += ` LIMIT $1 OFFSET $2`;

    const result = await this.dataSource.query(query, [
      limit,
      offset,
    ]);

    return {
      status: true,
      message: 'Exam Types fetched successfully',
      data: result,
      totalRecords: Number(total[0].count),
      totalPages: Math.ceil(Number(total[0].count) / limit),
    };
  }

  // ===================== DELETE =====================

  async deleteExamType(exam_type_id: number) {
    const exists = await this.dataSource.query(
      `
      SELECT exam_type_id
      FROM exam_types
      WHERE exam_type_id=$1
      AND status=1
      `,
      [exam_type_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Exam Type not found');
    }

    await this.dataSource.query(
      `
      UPDATE exam_types
      SET
        status=0,
        updated_at=NOW()
      WHERE exam_type_id=$1
      `,
      [exam_type_id],
    );

    return {
      status: true,
      message: 'Exam Type deleted successfully',
    };
  }

  // ===================== SEARCH =====================

  async searchExamType(
    keyword: string,
    page?: number,
    limit?: number,
  ) {
    const search = `%${keyword}%`;

    let params: any[] = [search];
    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;

      pagination = ` LIMIT $2 OFFSET $3`;

      params.push(limit, offset);
    }

    const result = await this.dataSource.query(
      `
      SELECT *
      FROM exam_types
      WHERE status=1
      AND exam_type ILIKE $1
      ORDER BY exam_type_id DESC
      ${pagination}
      `,
      params,
    );

    const total = await this.dataSource.query(
      `
      SELECT COUNT(*)
      FROM exam_types
      WHERE status=1
      AND exam_type ILIKE $1
      `,
      [search],
    );

    return {
      status: true,
      message: 'Exam Types fetched successfully',
      data: result,
      totalRecords: Number(total[0].count),
      totalPages:
        page && limit
          ? Math.ceil(Number(total[0].count) / limit)
          : 1,
    };
  }

  // ===================== FILTER =====================

  async filterExamType(
    filters: any,
    page?: number,
    limit?: number,
  ) {
    let condition = `WHERE status=1`;
    const params: any[] = [];
    let index = 1;

    if (filters.exam_type) {
      condition += ` AND exam_type ILIKE $${index++}`;
      params.push(`%${filters.exam_type}%`);
    }

    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;

      pagination = ` LIMIT $${index++} OFFSET $${index++}`;

      params.push(limit, offset);
    }

    const result = await this.dataSource.query(
      `
      SELECT *
      FROM exam_types
      ${condition}
      ORDER BY exam_type_id DESC
      ${pagination}
      `,
      params,
    );

    const countParams =
      page && limit
        ? params.slice(0, params.length - 2)
        : params;

    const total = await this.dataSource.query(
      `
      SELECT COUNT(*)
      FROM exam_types
      ${condition}
      `,
      countParams,
    );

    return {
      status: true,
      message: 'Filtered Exam Types fetched successfully',
      data: result,
      totalRecords: Number(total[0].count),
      totalPages:
        page && limit
          ? Math.ceil(Number(total[0].count) / limit)
          : 1,
    };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateComplaintDto } from './complaints.dto';

@Injectable()
export class ComplaintsService {
  constructor(private readonly dataSource: DataSource) {}

  async create(dto: CreateComplaintDto) {
    const query = `
      INSERT INTO complaints
      (
        branch_id,
        raised_by,
        raised_by_id,
        raised_by_class_id,
        raised_by_section_id,
        complaint_type,
        against_id,
        against_class_id,
        against_section_id,
        priority,
        message,
        resolution_note,
        status
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)
      RETURNING complaint_id
    `;

    const params = [
      dto.branch_id,
      dto.raised_by,
      dto.raised_by_id,
      dto.raised_by_class_id ?? null,
      dto.raised_by_section_id ?? null,
      dto.complaint_type,
      dto.against_id,
      dto.against_class_id ?? null,
      dto.against_section_id ?? null,
      dto.priority,
      dto.message,
      dto.resolution_note ?? null,
    ];

    try {
      await this.dataSource.query(query, params);
      return { status: true, message: 'Complaint raised successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to create complaint: ' + error.message);
    }
  }

  async updateComplaint(id: number, dto: Partial<CreateComplaintDto>) {
    if (!id) {
      throw new BadRequestException('Complaint ID is required');
    }

    const exists = await this.dataSource.query(
      `SELECT complaint_id FROM complaints WHERE complaint_id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Complaint not found');
    }

    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dto.branch_id !== undefined) {
      fields.push(`branch_id = $${idx++}`);
      params.push(dto.branch_id);
    }
    if (dto.raised_by !== undefined) {
      fields.push(`raised_by = $${idx++}`);
      params.push(dto.raised_by);
    }
    if (dto.raised_by_id !== undefined) {
      fields.push(`raised_by_id = $${idx++}`);
      params.push(dto.raised_by_id);
    }
    if (dto.raised_by_class_id !== undefined) {
      fields.push(`raised_by_class_id = $${idx++}`);
      params.push(dto.raised_by_class_id ?? null);
    }
    if (dto.raised_by_section_id !== undefined) {
      fields.push(`raised_by_section_id = $${idx++}`);
      params.push(dto.raised_by_section_id ?? null);
    }
    if (dto.complaint_type !== undefined) {
      fields.push(`complaint_type = $${idx++}`);
      params.push(dto.complaint_type);
    }
    if (dto.against_id !== undefined) {
      fields.push(`against_id = $${idx++}`);
      params.push(dto.against_id);
    }
    if (dto.against_class_id !== undefined) {
      fields.push(`against_class_id = $${idx++}`);
      params.push(dto.against_class_id ?? null);
    }
    if (dto.against_section_id !== undefined) {
      fields.push(`against_section_id = $${idx++}`);
      params.push(dto.against_section_id ?? null);
    }
    if (dto.priority !== undefined) {
      fields.push(`priority = $${idx++}`);
      params.push(dto.priority);
    }
    if (dto.complaint_status !== undefined) {
      fields.push(`complaint_status = $${idx++}`);
      params.push(dto.complaint_status);
    }
    if (dto.message !== undefined) {
      fields.push(`message = $${idx++}`);
      params.push(dto.message);
    }
    if (dto.resolution_note !== undefined) {
      fields.push(`resolution_note = $${idx++}`);
      params.push(dto.resolution_note ?? null);
    }

    if (fields.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    params.push(id);
    const updateQuery = `
      UPDATE complaints
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE complaint_id = $${idx}
    `;

    await this.dataSource.query(updateQuery, params);

    return { status: true, message: 'Complaint updated successfully' };
  }

  async getAll(page?: number, limit?: number) {
    let baseQuery = `
      SELECT
        c.complaint_id,
        c.branch_id,
        c.raised_by,
        c.raised_by_id,
        c.raised_by_class_id,
        c.raised_by_section_id,
        c.complaint_type,
        c.against_id,
        c.against_class_id,
        c.against_section_id,
        c.priority,
        c.message,
        c.complaint_status,
        c.resolution_note,
        c.created_at,

        -- Raised by name
        CASE
          WHEN c.raised_by = 'student' THEN CONCAT(rs.first_name, ' ', rs.last_name)
          WHEN c.raised_by = 'teacher' THEN CONCAT(rt.first_name, ' ', rt.last_name)
          ELSE 'Unknown'
        END AS raised_by_name,

        -- Against name
        CASE
          WHEN c.complaint_type = 'teacher' THEN CONCAT(at.first_name, ' ', at.last_name)
          WHEN c.complaint_type = 'student' THEN CONCAT(asts.first_name, ' ', asts.last_name)
          ELSE 'Unknown'
        END AS against_name,

        b.branch_name

      FROM complaints c
      LEFT JOIN branches b ON b.branch_id = c.branch_id

      LEFT JOIN students rs ON c.raised_by = 'student' AND rs.student_id = c.raised_by_id
      LEFT JOIN teachers rt ON c.raised_by = 'teacher' AND rt.teacher_id = c.raised_by_id

      LEFT JOIN teachers at ON c.complaint_type = 'teacher' AND at.teacher_id = c.against_id
      LEFT JOIN students asts ON c.complaint_type = 'student' AND asts.student_id = c.against_id

      WHERE c.status = 1
      ORDER BY c.complaint_id DESC
    `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery);
      return {
        status: true,
        message: 'All Complaints fetched successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;
    const countRes = await this.dataSource.query(`SELECT COUNT(*) FROM complaints WHERE status = 1`);
    const totalRecords = Number(countRes[0].count);

    baseQuery += ` LIMIT $1 OFFSET $2`;
    const data = await this.dataSource.query(baseQuery, [limit, offset]);

    return {
      status: true,
      message: 'Paginated Complaints fetched successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  async getById(id: number) {
    if (!id) {
      throw new BadRequestException('Complaint ID is required');
    }

    const result = await this.dataSource.query(
      `
      SELECT 
        c.complaint_id,
        c.branch_id,
        c.raised_by,
        c.raised_by_id,
        c.raised_by_class_id,
        c.raised_by_section_id,
        c.complaint_type,
        c.against_id,
        c.against_class_id,
        c.against_section_id,
        c.priority,
        c.complaint_status,
        c.message,
        c.resolution_note
      FROM complaints c
      LEFT JOIN branches b ON b.branch_id = c.branch_id
      WHERE c.complaint_id = $1 AND c.status = 1
      `,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Complaint not found');
    }

    return {
      status: true,
      message: 'Complaint fetched successfully',
      data: result[0],
    };
  }

  async delete(id: number) {
    if (!id) {
      throw new BadRequestException('Complaint ID is required');
    }

    const exists = await this.dataSource.query(
      `SELECT complaint_id FROM complaints WHERE complaint_id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Complaint not found');
    }

    await this.dataSource.query(
      `UPDATE complaints SET status = 0, updated_at = NOW() WHERE complaint_id = $1`,
      [id],
    );

    return { status: true, message: 'Complaint deleted successfully' };
  }

  async searchComplaints(keyword: string, page?: number, limit?: number) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];

    let pagination = '';
    if (page && limit) {
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, (page - 1) * limit);
    }

    const query = `
      SELECT
        c.complaint_id,
        c.branch_id,
        c.raised_by,
        c.raised_by_id,
        c.complaint_type,
        c.against_id,
        c.priority,
        c.message,
        c.complaint_status,
        c.resolution_note,

        CASE
          WHEN c.raised_by = 'student' THEN CONCAT(rs.first_name, ' ', rs.last_name)
          WHEN c.raised_by = 'teacher' THEN CONCAT(rt.first_name, ' ', rt.last_name)
          ELSE 'Unknown'
        END AS raised_by_name,

        CASE
          WHEN c.complaint_type = 'teacher' THEN CONCAT(at.first_name, ' ', at.last_name)
          WHEN c.complaint_type = 'student' THEN CONCAT(asts.first_name, ' ', asts.last_name)
          ELSE 'Unknown'
        END AS against_name,

        b.branch_name

      FROM complaints c
      LEFT JOIN branches b ON b.branch_id = c.branch_id
      LEFT JOIN students rs ON c.raised_by = 'student' AND rs.student_id = c.raised_by_id
      LEFT JOIN teachers rt ON c.raised_by = 'teacher' AND rt.teacher_id = c.raised_by_id
      LEFT JOIN teachers at ON c.complaint_type = 'teacher' AND at.teacher_id = c.against_id
      LEFT JOIN students asts ON c.complaint_type = 'student' AND asts.student_id = c.against_id

      WHERE c.status = 1
        AND (
          b.branch_name ILIKE $1
          OR c.priority::text ILIKE $1
          OR c.message ILIKE $1
          OR c.complaint_status::text ILIKE $1
          OR c.resolution_note ILIKE $1
          OR CONCAT(rs.first_name, ' ', rs.last_name) ILIKE $1
          OR CONCAT(rt.first_name, ' ', rt.last_name) ILIKE $1
          OR CONCAT(at.first_name, ' ', at.last_name) ILIKE $1
          OR CONCAT(asts.first_name, ' ', asts.last_name) ILIKE $1
        )
      ORDER BY c.complaint_id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM complaints c
      LEFT JOIN branches b ON b.branch_id = c.branch_id
      LEFT JOIN students rs ON c.raised_by = 'student' AND rs.student_id = c.raised_by_id
      LEFT JOIN teachers rt ON c.raised_by = 'teacher' AND rt.teacher_id = c.raised_by_id
      LEFT JOIN teachers at ON c.complaint_type = 'teacher' AND at.teacher_id = c.against_id
      LEFT JOIN students asts ON c.complaint_type = 'student' AND asts.student_id = c.against_id
      WHERE c.status = 1
        AND (
          b.branch_name ILIKE $1
          OR c.priority::text ILIKE $1
          OR c.message ILIKE $1
          OR c.complaint_status::text ILIKE $1
          OR c.resolution_note ILIKE $1
          OR CONCAT(rs.first_name, ' ', rs.last_name) ILIKE $1
          OR CONCAT(rt.first_name, ' ', rt.last_name) ILIKE $1
          OR CONCAT(at.first_name, ' ', at.last_name) ILIKE $1
          OR CONCAT(asts.first_name, ' ', asts.last_name) ILIKE $1
        )
    `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Complaint search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterComplaints(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE c.status = 1`;
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name = $${idx++}`;
      params.push(filters.branch_name);
    }
    if (filters.raised_by?.trim()) {
      conditions += ` AND c.raised_by = $${idx++}`;
      params.push(filters.raised_by);
    }
    // if (filters.raised_by_id) {
    //   conditions += ` AND c.raised_by_id = $${idx++}`;
    //   params.push(filters.raised_by_id);
    // }
    if (filters.complaint_type?.trim()) {
      conditions += ` AND c.complaint_type = $${idx++}`;
      params.push(filters.complaint_type);
    }
    // if (filters.against_id) {
    //   conditions += ` AND c.against_id = $${idx++}`;
    //   params.push(filters.against_id);
    // }
    if (filters.priority?.trim()) {
      conditions += ` AND c.priority = $${idx++}`;
      params.push(filters.priority);
    }
    if (filters.complaint_status?.trim()) {
      conditions += ` AND c.complaint_status = $${idx++}`;
      params.push(filters.complaint_status);
    }
    // if (filters.message?.trim()) {
    //   conditions += ` AND c.message ILIKE $${idx++}`;
    //   params.push(`%${filters.message.trim()}%`);
    // }

    let baseQuery = `
      SELECT
        c.complaint_id,
        c.branch_id,
        c.raised_by,
        c.raised_by_id,
        c.raised_by_class_id,
        c.raised_by_section_id,
        c.complaint_type,
        c.against_id,
        c.against_class_id,
        c.against_section_id,
        c.priority,
        c.message,
        c.complaint_status,
        c.resolution_note,

        CASE
          WHEN c.raised_by = 'student' THEN CONCAT(rs.first_name, ' ', rs.last_name)
          WHEN c.raised_by = 'teacher' THEN CONCAT(rt.first_name, ' ', rt.last_name)
          ELSE 'Unknown'
        END AS raised_by_name,

        CASE
          WHEN c.complaint_type = 'teacher' THEN CONCAT(at.first_name, ' ', at.last_name)
          WHEN c.complaint_type = 'student' THEN CONCAT(asts.first_name, ' ', asts.last_name)
          ELSE 'Unknown'
        END AS against_name,

        b.branch_name

      FROM complaints c
      LEFT JOIN branches b ON b.branch_id = c.branch_id
      LEFT JOIN students rs ON c.raised_by = 'student' AND rs.student_id = c.raised_by_id
      LEFT JOIN teachers rt ON c.raised_by = 'teacher' AND rt.teacher_id = c.raised_by_id
      LEFT JOIN teachers at ON c.complaint_type = 'teacher' AND at.teacher_id = c.against_id
      LEFT JOIN students asts ON c.complaint_type = 'student' AND asts.student_id = c.against_id

      ${conditions}
      ORDER BY c.complaint_id DESC
    `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Complaints filtered successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;
    baseQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const data = await this.dataSource.query(baseQuery, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM complaints c
      LEFT JOIN branches b ON b.branch_id = c.branch_id
      ${conditions}
    `;
    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Complaints filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }
}
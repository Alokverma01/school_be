import { MinLength } from 'class-validator';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TeacherPayrollLeaveService {
  constructor(private readonly dataSource: DataSource) { }

  async createPayroll(body: any) {
    if (body.payment_date) {
      const paymentDate = new Date(body.payment_date);
      const today = new Date();
      if (paymentDate > today) {
        throw new BadRequestException('Payment date cannot be in the future');
      }
    }

    await this.dataSource.query(
      `
      INSERT INTO teacher_payroll
      (branch_id, teacher_id, month, year, base_salary, deductions, incentives, net_salary, paid_status, payment_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        body.branch_id,
        body.teacher_id,
        body.month,
        body.year,
        body.base_salary,
        body.deductions,
        body.incentives,
        body.net_salary,
        body.paid_status,
        body.payment_date || null,
      ],
    );

    return { status: true, message: 'Payroll created successfully' };
  }

  async getAllPayroll(page?: number, limit?: number) {
    let query = `
      SELECT 
      p.payroll_id,
      p.branch_id,
      b.branch_name,
      p.teacher_id,
      CONCAT(t.first_name , ' ' ,t.last_name) as teacher_name,
      p.month,
      p.year,
      p.base_salary,
      p.deductions,
      p.incentives,
      p.net_salary,
      p.paid_status,
      p.payment_date
      FROM teacher_payroll p
      LEFT JOIN branches b on b.branch_id = p.branch_id
      LEFT JOIN teachers t on t.teacher_id = p.teacher_id
      WHERE p.status = 1
      ORDER BY p.payroll_id ASC
    `;

    if (page && limit) {
      query += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
    }

    const data = await this.dataSource.query(query);
    const count = await this.dataSource.query(
      `SELECT COUNT(*) FROM teacher_payroll WHERE status = 1`,
    );

    return {
      status: true,
      message: 'Teachers Payroll fetched successfully',
      data,
      totalRecords: parseInt(count[0].count),
      totalPages: limit ? Math.ceil(count[0].count / limit) : 1,
    };
  }

  async getPayrollById(payroll_id: number) {
    if (!payroll_id) {
      throw new BadRequestException('payroll_id is required');
    }

    const query = `
    SELECT 
      p.payroll_id,
      p.branch_id,
      p.teacher_id,
      p.month,
      p.year,
      p.base_salary,
      p.deductions,
      p.incentives,
      p.net_salary,
      p.paid_status,
      p.payment_date
      FROM teacher_payroll p
      WHERE p.status = 1
        AND p.payroll_id = $1
    `;

    const result = await this.dataSource.query(query, [payroll_id]);

    if (result.length === 0) {
      throw new NotFoundException('Payroll not found');
    }

    return {
      status: true,
      message: 'Teacher payroll by id fetched successfully',
      data: result[0],
    };
  }

  async updatePayroll(payroll_id: number, body: any) {
    if (!payroll_id) {
      throw new BadRequestException('payroll_id is required');
    }

    if (body.payment_date) {
      const paymentDate = new Date(body.payment_date);
      const today = new Date();
      if (paymentDate > today) {
        throw new BadRequestException('Payment date cannot be in the future');
      }
    }

    const exist = await this.dataSource.query(
      `
      SELECT * FROM teacher_payroll where payroll_id = $1 AND status = 1
      `,
      [payroll_id],
    );

    if (exist.length === 0) {
      throw new NotFoundException('Payroll not found');
    }

    const result = await this.dataSource.query(
      `
    UPDATE teacher_payroll
    SET
      branch_id    = $1,
      teacher_id   = $2,
      month        = $3,
      year         = $4,
      base_salary  = $5,
      deductions   = $6,
      incentives   = $7,
      net_salary   = $8,
      paid_status  = $9,
      payment_date = $10
    WHERE payroll_id = $11
      AND status = 1
    RETURNING *
    `,
      [
        body.branch_id,
        body.teacher_id,
        body.month,
        body.year,
        body.base_salary,
        body.deductions,
        body.incentives,
        body.net_salary,
        body.paid_status,
        body.payment_date || null,
        payroll_id,
      ],
    );

    return {
      status: true,
      message: 'Payroll updated successfully',
    };
  }

  async deletePayroll(payroll_id: number) {
    if (!payroll_id) {
      throw new BadRequestException('payroll_id is required');
    }

    const exist = await this.dataSource.query(
      `
      SELECT * FROM teacher_payroll where payroll_id = $1 AND status = 1
      `,
      [payroll_id],
    );

    if (exist.length === 0) {
      throw new NotFoundException('Payroll not found');
    }

    await this.dataSource.query(
      `UPDATE teacher_payroll SET status = 0 WHERE payroll_id = $1`,
      [payroll_id],
    );

    return { status: true, message: 'Payroll deleted successfully' };
  }

  async searchPayroll(keyword: string, page?: number, limit?: number) {
    const search = `%${keyword}%`;

    let params: any[] = [search];
    let pagination = '';

    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
    SELECT 
      p.payroll_id,
      p.branch_id,
      b.branch_name,
      p.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      p.month,
      p.year,
      p.base_salary,
      p.deductions,
      p.incentives,
      p.net_salary,
      p.paid_status,
      p.payment_date
    FROM teacher_payroll p
    LEFT JOIN branches b ON b.branch_id = p.branch_id
    LEFT JOIN teachers t 
      ON t.teacher_id = p.teacher_id
    WHERE p.status = 1
      AND (
        CONCAT(t.first_name, ' ', t.last_name) ILIKE $1
        OR p.month::text ILIKE $1
        OR p.paid_status::text ILIKE $1
        OR b.branch_name ILIKE $1
      )
    ORDER BY p.payroll_id ASC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
    SELECT COUNT(*) 
    FROM teacher_payroll p
    LEFT JOIN branches b ON b.branch_id = p.branch_id
    LEFT JOIN teachers t 
      ON t.teacher_id = p.teacher_id
    WHERE p.status = 1
      AND (
        CONCAT(t.first_name, ' ', t.last_name) ILIKE $1
        OR p.month::text ILIKE $1
        OR p.paid_status::text ILIKE $1
        OR b.branch_name ILIKE $1
      )
  `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Payroll search results fetched successfully',
      data,
      totalRecords,
      totalPages:
        page !== undefined && limit !== undefined
          ? Math.ceil(totalRecords / limit)
          : 1,
    };
  }

  async filterPayroll(filters: any, page?: number, limit?: number) {
    let conditions = 'WHERE p.status = 1';
    const params: any[] = [];
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name ILIKE $${idx++}`;
      params.push(filters.branch_name);
    }

    if (filters.teacher_name) {
      conditions += ` AND CONCAT(t.first_name, ' ', t.last_name) ILIKE $${idx++}`;
      params.push(filters.teacher_name);
    }

    if (filters.month) {
      conditions += ` AND p.month::text ILIKE $${idx++}`;
      params.push(filters.month);
    }

    if (filters.year) {
      conditions += ` AND p.year::text ILIKE $${idx++}`;
      params.push(filters.year);
    }

    if (filters.paid_status !== undefined) {
      conditions += ` AND p.paid_status::text ILIKE $${idx++}`;
      params.push(filters.paid_status);
    }

    if (filters.min_salary) {
      conditions += ` AND p.net_salary >= $${idx++}`;
      params.push(filters.min_salary);
    }

    if (filters.max_salary) {
      conditions += ` AND p.net_salary <= $${idx++}`;
      params.push(filters.max_salary);
    }

    let pagination = '';
    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    const query = `
    SELECT 
      p.payroll_id,
      p.branch_id,
      b.branch_name,
      p.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      p.month,
      p.year,
      p.base_salary,
      p.deductions,
      p.incentives,
      p.net_salary,
      p.paid_status,
      p.payment_date
    FROM teacher_payroll p
    LEFT JOIN branches b ON b.branch_id = p.branch_id
    LEFT JOIN teachers t 
      ON t.teacher_id = p.teacher_id
    ${conditions}
    ORDER BY p.payroll_id ASC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const countParams =
      page !== undefined && limit !== undefined
        ? params.slice(0, params.length - 2)
        : params;

    const countQuery = `
    SELECT COUNT(*) 
    FROM teacher_payroll p
    LEFT JOIN branches b ON b.branch_id = p.branch_id
    LEFT JOIN teachers t 
      ON t.teacher_id = p.teacher_id
    ${conditions}
  `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Filtered payroll fetched successfully',
      data,
      totalRecords,
      totalPages:
        page !== undefined && limit !== undefined
          ? Math.ceil(totalRecords / limit)
          : 1,
    };
  }

  async applyLeave(body: any) {
    const fromDate = new Date(body.from_date);
    const toDate = new Date(body.to_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate < today) {
      throw new BadRequestException('Leave start date cannot be in the past');
    }

    if (toDate < fromDate) {
      throw new BadRequestException('Leave end date cannot be before start date');
    }

    await this.dataSource.query(
      `
      INSERT INTO teacher_leave
      (branch_id, teacher_id, leave_type, from_date, to_date, reason)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        body.branch_id,
        body.teacher_id,
        body.leave_type,
        body.from_date,
        body.to_date,
        body.reason,
      ],
    );

    return { status: true, message: 'Leave applied successfully' };
  }

  async getAllLeaves(page?: number, limit?: number) {
    let query = `
      SELECT 
       tl.leave_id, 
       tl.branch_id,
       b.branch_name,
       tl.teacher_id,
       CONCAT(t.first_name , ' ' , t.last_name) as teacher_name,
       tl.leave_type,
       tl.from_date,
       tl.to_date,
       tl.reason,
       tl.leave_status
      FROM teacher_leave tl
      LEFT JOIN branches b ON b.branch_id = tl.branch_id
      LEFT JOIN teachers t ON t.teacher_id = tl.teacher_id 
      WHERE tl.status = 1
      ORDER BY tl.leave_id ASC
    `;

    if (page && limit) {
      query += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
    }

    const data = await this.dataSource.query(query);
    const count = await this.dataSource.query(
      `SELECT COUNT(*) FROM teacher_leave WHERE status = 1`,
    );

    return {
      status: true,
      message: 'Teacher Leave records fetched successfully',
      data,
      totalRecords: parseInt(count[0].count),
      totalPages: limit ? Math.ceil(count[0].count / limit) : 1,
    };
  }

  async getLeaveById(leave_id: number) {
    if (!leave_id) {
      throw new BadRequestException('leave_id is required');
    }

    const result = await this.dataSource.query(
      `
    SELECT 
      tl.leave_id,
      tl.branch_id,
      b.branch_name,
      tl.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      tl.leave_type,
      tl.from_date,
      tl.to_date,
      tl.reason,
      tl.leave_status
    FROM teacher_leave tl
    LEFT JOIN branches b ON b.branch_id = tl.branch_id
    LEFT JOIN teachers t ON t.teacher_id = tl.teacher_id
    WHERE tl.leave_id = $1
      AND tl.status = 1
    `,
      [leave_id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Leave record not found');
    }

    return {
      status: true,
      message: 'Teacher leave fetched successfully',
      data: result[0],
    };
  }

  async updateLeave(leave_id: number, body: any) {
    if (!leave_id) {
      throw new BadRequestException('leave_id is required');
    }

    if (body.from_date && body.to_date) {
      const fromDate = new Date(body.from_date);
      const toDate = new Date(body.to_date);

      if (toDate < fromDate) {
        throw new BadRequestException(
          'Leave end date cannot be before start date',
        );
      }
    }

    const exist = await this.dataSource.query(
      `
       SELECT * FROM teacher_leave WHERE leave_id = $1 AND status=1
      `,
      [leave_id],
    );

    if (exist.length === 0) {
      throw new NotFoundException('Leave not found');
    }

    await this.dataSource.query(
      `
    UPDATE teacher_leave
    SET
      branch_id  = $1,
      teacher_id = $2,
      leave_type = $3,
      from_date  = $4,
      to_date    = $5,
      reason     = $6
    WHERE leave_id = $7
      AND status = 1
    RETURNING *
    `,
      [body.branch_id, body.teacher_id, body.leave_type, body.from_date, body.to_date, body.reason, leave_id],
    );

    return {
      status: true,
      message: 'Leave updated successfully',
    };
  }

  async deleteLeave(leave_id: number) {
    if (!leave_id) {
      throw new BadRequestException('leave_id is required');
    }

    const exist = await this.dataSource.query(
      `
       SELECT * FROM teacher_leave WHERE leave_id = $1 AND status=1
      `,
      [leave_id],
    );

    if (exist.length === 0) {
      throw new NotFoundException('Leave not found');
    }

    await this.dataSource.query(
      `UPDATE teacher_leave SET status = 0 WHERE leave_id = $1`,
      [leave_id],
    );

    return { status: true, message: 'Leave deleted successfully' };
  }

  async searchLeaves(keyword: string, page?: number, limit?: number) {
    const search = `%${keyword}%`;

    let params: any[] = [search];
    let pagination = '';

    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
    SELECT 
      tl.leave_id,
      tl.branch_id,
      b.branch_name,
      tl.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      tl.leave_type,
      tl.from_date,
      tl.to_date,
      tl.reason,
      tl.leave_status
    FROM teacher_leave tl
    LEFT JOIN branches b ON b.branch_id = tl.branch_id
    LEFT JOIN teachers t 
      ON t.teacher_id = tl.teacher_id
    WHERE tl.status = 1
      AND (
        CONCAT(t.first_name, ' ', t.last_name) ILIKE $1
        OR tl.leave_type::text ILIKE $1
        OR tl.leave_status::text ILIKE $1
        OR tl.reason ILIKE $1
        OR b.branch_name ILIKE $1
      )
    ORDER BY tl.leave_id ASC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
    SELECT COUNT(*) 
    FROM teacher_leave tl
    LEFT JOIN branches b ON b.branch_id = tl.branch_id
    LEFT JOIN teachers t 
      ON t.teacher_id = tl.teacher_id
    WHERE tl.status = 1
      AND (
        CONCAT(t.first_name, ' ', t.last_name) ILIKE $1
        OR tl.leave_type::text ILIKE $1
        OR tl.leave_status::text ILIKE $1
        OR tl.reason ILIKE $1
        OR b.branch_name ILIKE $1
      )
  `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Teacher leave search results fetched successfully',
      data,
      totalRecords,
      totalPages:
        page !== undefined && limit !== undefined
          ? Math.ceil(totalRecords / limit)
          : 1,
    };
  }

  async filterLeaves(filters: any, page?: number, limit?: number) {
    let conditions = 'WHERE tl.status = 1';
    const params: any[] = [];
    let idx = 1;

    if (filters.branch_id) {
      conditions += ` AND tl.branch_id = $${idx++}`;
      params.push(filters.branch_id);
    }

    if (filters.teacher_id) {
      conditions += ` AND tl.teacher_id = $${idx++}`;
      params.push(filters.teacher_id);
    }

    if (filters.leave_type) {
      conditions += ` AND tl.leave_type = $${idx++}`;
      params.push(filters.leave_type);
    }

    if (filters.leave_status) {
      conditions += ` AND tl.leave_status = $${idx++}`;
      params.push(filters.leave_status);
    }

    if (filters.from_date) {
      conditions += ` AND tl.from_date >= $${idx++}`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      conditions += ` AND tl.to_date <= $${idx++}`;
      params.push(filters.to_date);
    }

    let pagination = '';
    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    const query = `
    SELECT 
      tl.leave_id,
      tl.branch_id,
      b.branch_name,
      tl.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      tl.leave_type,
      tl.from_date,
      tl.to_date,
      tl.reason,
      tl.leave_status
    FROM teacher_leave tl
    LEFT JOIN branches b ON b.branch_id = tl.branch_id
    LEFT JOIN teachers t 
      ON t.teacher_id = tl.teacher_id
    ${conditions}
    ORDER BY tl.leave_id ASC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const countParams =
      page !== undefined && limit !== undefined
        ? params.slice(0, params.length - 2)
        : params;

    const countQuery = `
      SELECT COUNT(*) 
      FROM teacher_leave tl
      LEFT JOIN branches b ON b.branch_id = tl.branch_id
      ${conditions}
    `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Filtered teacher leaves fetched successfully',
      data,
      totalRecords,
      totalPages:
        page !== undefined && limit !== undefined
          ? Math.ceil(totalRecords / limit)
          : 1,
    };
  }
}

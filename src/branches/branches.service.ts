import { IsNumber } from 'class-validator';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class BranchesService {
  constructor(private dataSource: DataSource) {}

  // GET PRINCIPALS
  async getPrincipals() {
    const query = `
    SELECT 
      u.user_id,
      CONCAT(u.first_name, ' ', u.last_name) AS name
    FROM users u
    INNER JOIN roles r ON r.role_id = u.role_id
    WHERE r.role_name = 'Principal' AND u.status = 1
  `;

    const users = await this.dataSource.query(query);

    return {
      status: true,
      message: 'Principals fetched successfully',
      data: users,
    };
  }

  // CREATE
  async create(data: any) {
    const exists = await this.dataSource.query(
      `SELECT branch_id FROM branches WHERE branch_code = $1 AND status = 1 LIMIT 1`,
      [data.branch_code],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Branch code already exists');
    }

    await this.dataSource.query(
      `
      INSERT INTO branches 
        (branch_code, branch_name , address, principal_id, total_classes, total_students, status, created_at, updated_at)
        VALUES
        ($1,$2,$3,$4,$5,$6,1,NOW(),NOW())
      `,
      [
        data.branch_code,
        data.branch_name,
        data.address,
        data.principal_id,
        data.total_classes,
        data.total_students,
      ],
    );

    return {
      status: true,
      message: 'Branch created successfully',
    };
  }

  // FIND ALL WITH PAGINATION
  async findAll(page?: number, limit?: number) {
    let query = `
    SELECT
     b.branch_id,
     b.branch_code,
     b.branch_name,
     b.address,
     CONCAT(u.first_name, ' ', u.last_name) AS principal_name,
      b.total_classes,
      b.total_students
    FROM branches b
    LEFT JOIN users u on u.user_id = b.principal_id AND u.status = 1
    WHERE b.status = 1
    ORDER BY b.branch_id ASC
  `;

    const params: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $1 OFFSET $2 `;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(query, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM branches WHERE status = 1`,
    );

    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Branches fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // FIND BY ID
  async findById(branch_id: number) {
    if (!branch_id) {
      throw new BadRequestException('branch_id is required');
    }

    const query = `
    SELECT branch_id, branch_code,branch_name, address, principal_id, total_classes, total_students
    FROM branches
    WHERE branch_id = $1 AND status = 1
  `;

    const result = await this.dataSource.query(query, [branch_id]);

    if (result.length === 0) {
      throw new BadRequestException('Branch Not Found');
    }

    return {
      status: true,
      message: 'Branch fetched successfully',
      data: result[0],
    };
  }

  // UPDATE
  async update(branch_id: number, data: any) {
    if (!branch_id) {
      throw new BadRequestException('branch_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT branch_id FROM branches WHERE branch_id = $1 AND status = 1`,
      [branch_id],
    );

    if (exists.length === 0) {
      throw new BadRequestException('Branch not found');
    }

    const fields: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;

    for (const key of [
      'branch_code',
      'branch_name',
      'address',
      'principal_id',
      'total_classes',
      'total_students',
    ]) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        params.push(data[key]);
        idx++;
      }
    }

    params.push(branch_id);

    const query = `
    UPDATE branches
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE branch_id = $${idx}
  `;

    await this.dataSource.query(query, params);

    return { status: true, message: 'Branch updated successfully' };
  }

  // DELETE (Soft Delete)
  async delete(branch_id: number) {
    if (!branch_id) {
      throw new BadRequestException('branch_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT branch_id FROM branches WHERE branch_id = $1 AND status = 1`,
      [branch_id],
    );

    if (exists.length === 0) {
      throw new BadRequestException('Branch not found');
    }

    await this.dataSource.query(
      `UPDATE branches SET status = 0 WHERE branch_id = $1`,
      [branch_id],
    );

    return {
      status: true,
      message: 'Branch deleted successfully',
    };
  }

  // SEARCH BRANCHES
  async search(keyword: string, page?: number, limit?: number) {
    if (!keyword || keyword.trim() === '') {
      throw new BadRequestException('keyword is required');
    }

    // Sanitizing keyword for ILIKE
    const searchValue = `%${keyword.toLowerCase()}%`;

    let query = `
    SELECT 
      b.branch_id,
      b.branch_code,
      b.branch_name,
      b.address,
      CONCAT(u.first_name, ' ', u.last_name) AS principal_name,
      b.total_classes,
      b.total_students
    FROM branches b
    LEFT JOIN users u ON u.user_id = b.principal_id AND u.status = 1
    WHERE b.status = 1
      AND (
        LOWER(b.branch_code) LIKE $1 OR
        LOWER(b.branch_name) LIKE $1 OR
        LOWER(b.address) LIKE $1 OR
        LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE $1
      )
    ORDER BY b.branch_id DESC
  `;

    const params: any[] = [searchValue];

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(query, params);

    // Count total matching records
    const totalCountQuery = `
    SELECT COUNT(*) FROM branches b
    LEFT JOIN users u ON u.user_id = b.principal_id AND u.status = 1
    WHERE b.status = 1
      AND (
        LOWER(b.branch_code) LIKE $1 OR
        LOWER(b.branch_name) LIKE $1 OR
        LOWER(b.address) LIKE $1 OR
        LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE $1
      )
  `;

    const totalCount = await this.dataSource.query(totalCountQuery, [
      searchValue,
    ]);
    const totalRecords = Number(totalCount[0].count);

    return {
      status: true,
      message: 'Search results fetched successfully',
      keyword,
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filter(filters: any, page?: number, limit?: number) {
    const conditions: string[] = [`b.status = 1`];
    const params: any[] = [];
    let paramIndex = 1;

    // ----------- Dynamic Filters -----------

    if (filters.branch_code) {
      conditions.push(`LOWER(b.branch_code) LIKE $${paramIndex++}`);
      params.push(`%${filters.branch_code.toLowerCase()}%`);
    }

    if (filters.branch_name) {
      conditions.push(`LOWER(b.branch_name) LIKE $${paramIndex++}`);
      params.push(`%${filters.branch_name.toLowerCase()}%`);
    }

    if (filters.address) {
      conditions.push(`LOWER(b.address) LIKE $${paramIndex++}`);
      params.push(`%${filters.address.toLowerCase()}%`);
    }

    if (filters.principal_name) {
      conditions.push(` LOWER(u.first_name || ' ' || u.last_name) LIKE $${paramIndex++}`);
      params.push(`%${filters.principal_name.toLowerCase()}%`);
    }

    if (filters.from_date && filters.to_date) {
      conditions.push(
        `b.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`,
      );
      params.push(filters.from_date, filters.to_date);
      paramIndex += 2;
    } else {
      if (filters.from_date) {
        conditions.push(`b.created_at >= $${paramIndex++}`);
        params.push(filters.from_date);
      }

      if (filters.to_date) {
        conditions.push(`b.created_at <= $${paramIndex++}`);
        params.push(filters.to_date);
      }
    }

    // --------- Base Query ---------

    let query = `
    SELECT 
      b.branch_id,
      b.branch_code,
      b.branch_name,
      b.address,
      CONCAT(u.first_name, ' ', u.last_name) AS principal_name,
      b.total_classes,
      b.total_students
    FROM branches b
    LEFT JOIN users u ON u.user_id = b.principal_id AND u.status = 1
    WHERE ${conditions.join(' AND ')}
    ORDER BY b.branch_id DESC
    `;

  
    const paginationParams: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      paginationParams.push(limit, offset);
    }

    const finalParams = [...params, ...paginationParams];

    const data = await this.dataSource.query(query, finalParams);


    const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM branches b
    LEFT JOIN users u ON u.user_id = b.principal_id AND u.status = 1
    WHERE ${conditions.join(' AND ')}
  `;

    const totalCount = await this.dataSource.query(countQuery, params);
    const totalRecords = totalCount[0]?.count ?? 0;

    return {
      status: true,
      message: 'Filtered branch results',
      // filters,
      data,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
      currentPage: page || 1,
    };
  }
}

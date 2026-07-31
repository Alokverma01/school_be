
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DepartmentService {
  constructor(private readonly dataSource: DataSource) {}
  async create(data: any) {
    const departmentName = data.department_name;

    // Check if department exists
    const exists = await this.dataSource.query(
      `SELECT department_id FROM departments WHERE department_name = $1 LIMIT 1`, [departmentName],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Department Already Exist');
    }

    // Insert new department
    await this.dataSource.query(
      `INSERT INTO departments (department_name, status) VALUES ($1, 1)`,[departmentName],
    );

    return {
      status: true,
      message: 'Department Added',
    };
  }

  async findAll() {
    const data = await this.dataSource.query(
      `SELECT department_id, department_name
       FROM departments 
       WHERE status = 1 
       ORDER BY department_id ASC`
    );

    return {
      status: true,
      message: 'Departments fetched successfully',
      data,
    };
  }

  async search(keyword?: string, page?: number, limit?: number) {
    let query = `
      SELECT department_id, department_name
      FROM departments
      WHERE status = 1
    `;

    const params: any[] = [];

    // Search condition
    if (keyword && keyword.trim() !== '') {
      keyword = `%${keyword}%`;
      query += ` AND department_name ILIKE $1`;
      params.push(keyword);
    }

    query += ` ORDER BY department_id ASC`;

    // Pagination
    if (page && limit) {
      const offset = (page - 1) * limit;
      query += params.length > 0 ? ` LIMIT $2 OFFSET $3` : ` LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(query, params);

    // Count total with applied keyword filter
    const totalQuery = `
      SELECT COUNT(*) FROM departments
      WHERE status = 1
      ${keyword ? `AND department_name ILIKE '${keyword}'` : ''}
    `;

    const total = await this.dataSource.query(totalQuery);

    return {
      status: true,
      message: keyword ? 'Department Search Result' : 'All Departments',
      data,
      totalRecords: Number(total[0].count),
      totalPages: limit ? Math.ceil(total[0].count / limit) : 1,
    };
  }
}


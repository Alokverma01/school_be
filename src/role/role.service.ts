import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(private readonly dataSource: DataSource) {}

  // Create a new role
  async create(data: any) {
    if (!data.role_name) {
      throw new BadRequestException('Role name is required');
    }

    if (!data.access || Object.keys(data.access).length === 0) {
      throw new BadRequestException('Permissions cannot be empty');
    }

    // Check for uniqueness
    const existing = await this.dataSource.query(
      `SELECT role_id FROM roles WHERE role_name = $1 AND status = 1`,
      [data.role_name],
    );
    if (existing.length > 0) {
      throw new BadRequestException('Role Name Already Exist');
    }

    const query = `
      INSERT INTO roles (role_name, department, reports_to, access, status)
      VALUES ($1, $2, $3, $4::jsonb, 1)
      RETURNING role_id
    `;
    const result = await this.dataSource.query(query, [
      data.role_name,
      data.department ? Number(data.department) : null,
      data.reports_to ? Number(data.reports_to) : null,
      JSON.stringify(data.access),
    ]);

    return {
      status: true,
      message: 'Role created successfully',
      role_id: result[0].role_id,
    };
  }

  // Get all roles (with optional pagination)
  async findAll(page?: number, limit?: number) {
    let query = `
      SELECT 
        r.role_id,
        r.role_name,
        r.access,
        r.reports_to,
        r.department,
        d.department_name,
        rt.role_name AS reports_to_name
      FROM roles r
      LEFT JOIN departments d ON d.department_id = r.department
      LEFT JOIN roles rt ON rt.role_id = r.reports_to
      WHERE r.status = 1
      ORDER BY r.role_id ASC
    `;

    let totalRecordsQuery = `SELECT COUNT(*) FROM roles WHERE status = 1`;

    const totalRecordsResult = await this.dataSource.query(totalRecordsQuery);
    const totalRecords = parseInt(totalRecordsResult[0].count);

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const roles = await this.dataSource.query(query);
    console.log(roles);

    return {
      status: true,
      message:
        page && limit
          ? 'Paginated Roles Fetched'
          : 'Roles fetched successfully',
      data: roles.map((r) => ({
        role_id: r.role_id,
        role_name: r.role_name,
        department: r.department_name || null,
        reports_to: r.reports_to_name || null,
        access: r.access,
      })),
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // Get role by ID
  async findById(role_id: number) {
    if (!role_id) {
      throw new BadRequestException('role_id is required');
    }

    const query = `
      SELECT 
        r.role_id,
        r.role_name,
        r.access,
        r.reports_to,
        r.department,
        d.department_name
      FROM roles r
      LEFT JOIN departments d ON d.department_id = r.department
      WHERE r.role_id = $1
      LIMIT 1
    `;
    const result = await this.dataSource.query(query, [role_id]);

    if (!result.length) {
      throw new BadRequestException('Role Not Found');
    }

    const r = result[0];

    return {
      status: true,
      message: 'Role By Id Fetched successfully',
      data: {
        role_id: r.role_id,
        role_name: r.role_name,
        department: r.department || null,
        reports_to: r.reports_to || null,
        access: r.access,
      },
    };
  }

  // Update a role
  async update(role_id: number, data: any) {
    if (!role_id) {
      throw new BadRequestException('role_id is required');
    }

    // Check existence
    const exists = await this.dataSource.query(
      `SELECT role_id FROM roles WHERE role_id = $1 AND status = 1`,
      [role_id],
    );
    if (!exists.length) {
      throw new BadRequestException('Role Not Found');
    }

    if (!data.access || Object.keys(data.access).length === 0) {
      throw new BadRequestException('Permissions cannot be empty');
    }

    const updateFields: string[] = [];
    const params: (string | number)[] = [];
    let index = 1;

    if (data.role_name) {
      updateFields.push(`role_name = $${index++}`);
      params.push(data.role_name);
    }
    if (data.department) {
      updateFields.push(`department = $${index++}`);
      params.push(Number(data.department));
    }
    if (data.reports_to) {
      updateFields.push(`reports_to = $${index++}`);
      params.push(Number(data.reports_to));
    }
    if (data.access) {
      updateFields.push(`access = $${index++}::jsonb`);
      params.push(JSON.stringify(data.access));
    }

    params.push(role_id);

    const query = `
  UPDATE roles
  SET ${updateFields.join(', ')}
  WHERE role_id = $${index}
`;

    await this.dataSource.query(query, params);

    return {
      status: true,
      message: 'Role Updated successfully',
    };
  }

  // Soft delete a role
  async delete(role_id: number) {
    if (!role_id) {
      throw new BadRequestException('role_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT role_id FROM roles WHERE role_id = $1`,
      [role_id],
    );
    if (!exists.length) {
      throw new BadRequestException('Role Not Found');
    }

    const query = `UPDATE roles SET status = 0 WHERE role_id = $1`;
    await this.dataSource.query(query, [role_id]);

    return {
      status: true,
      message: 'Role deleted successfully',
    };
  }

  async search(keyword: string, page?: number, limit?: number) {
    const params: any[] = [];
    let query = `
    SELECT 
      r.role_id,
      r.role_name,
      r.access,
      r.reports_to,
      r.department,
      d.department_name,
      rt.role_name AS reports_to_name
    FROM roles r
    LEFT JOIN departments d ON d.department_id = r.department
    LEFT JOIN roles rt ON rt.role_id = r.reports_to
    WHERE r.status = 1
      AND (
        r.role_name ILIKE $1
        OR d.department_name ILIKE $1
        OR rt.role_name ILIKE $1
      )
    ORDER BY r.role_id ASC
  `;

    params.push(`%${keyword}%`);

    // Pagination
    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const roles = await this.dataSource.query(query, params);

    // Total count for search results
    let totalRecordsQuery = `
    SELECT COUNT(*) 
    FROM roles r
    LEFT JOIN departments d ON d.department_id = r.department
    LEFT JOIN roles rt ON rt.role_id = r.reports_to
    WHERE r.status = 1
      AND (
        r.role_name ILIKE $1
        OR d.department_name ILIKE $1
        OR rt.role_name ILIKE $1
      )
  `;
    const totalRecordsResult = await this.dataSource.query(totalRecordsQuery, [
      `%${keyword}%`,
    ]);
    const totalRecords = parseInt(totalRecordsResult[0].count);

    return {
      status: true,
      message:
        page && limit ? 'Paginated Search Results' : 'Full Search Result',
      data: roles.map((r) => ({
        role_id: r.role_id,
        role_name: r.role_name,
        department: r.department_name || null,
        reports_to: r.reports_to_name || null,
        access: r.access,
      })),
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
      currentPage: page || 1,
    };
  }

  async filterRoles(filters: any, page?: number, limit?: number) {
    const { role_name, department, reports_to } = filters;

    const params: any[] = [];
    let whereClause = `WHERE r.status = 1`;

    // Dynamic Filters
    if (role_name) {
      params.push(`%${role_name}%`);
      whereClause += ` AND r.role_name ILIKE $${params.length}`;
    }

    if (department) {
      params.push(`%${department}%`);
      whereClause += ` AND d.department_name ILIKE $${params.length}`;
    }

    if (reports_to) {
      params.push(`%${reports_to}%`);
      whereClause += ` AND rt.role_name ILIKE $${params.length}`;
    }

    // MAIN Query
    let query = `
    SELECT 
      r.role_id,
      r.role_name,
      d.department_name,
      rt.role_name AS reports_to_name,
      r.access
    FROM roles r
    LEFT JOIN departments d ON d.department_id = r.department
    LEFT JOIN roles rt ON rt.role_id = r.reports_to
    ${whereClause}
    ORDER BY r.role_id DESC
  `;

    // Pagination
    if (page && limit) {
      const offset = (page - 1) * limit;
      params.push(limit, offset);
      query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const roles = await this.dataSource.query(query, params);

    // Count Total
    const countQuery = `
    SELECT COUNT(*) FROM roles r
    LEFT JOIN departments d ON d.department_id = r.department
    LEFT JOIN roles rt ON rt.role_id = r.reports_to
    ${whereClause}
  `;

    const totalRecords = Number(
      (
        await this.dataSource.query(
          countQuery,
          params.slice(0, params.length - (page && limit ? 2 : 0)),
        )
      )[0].count,
    );

    return {
      status: true,
      message: 'Filtered Results',
      data: roles.map((r) => ({
        role_id: r.role_id,
        role_name: r.role_name,
        department: r.department_name || null,
        reports_to: r.reports_to_name || null,
        access: r.access,
      })),
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
      currentPage: page || 1,
    };
  }
}

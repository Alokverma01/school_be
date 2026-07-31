import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly dataSource: DataSource) {}

  // Create user (transactional) - inserts into users and user_details
  async create(data: any) {
    return await this.dataSource.transaction(async (manager) => {
      // 🔎 1. Check if username OR email OR contact_number already exist
      const existingUser = await manager.query(
        `
      SELECT user_id FROM users 
      WHERE (username = $1 OR email = $2 OR contact_number = $3)
      LIMIT 1
      `,
        [data.username, data.email, data.contact_number],
      );

      if (existingUser.length > 0) {
        throw new BadRequestException(
          'Username or Email or Contact Number already exists',
        );
      }

      // 🔐 2. Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // 🧑‍💻 Convert required foreign keys
      const roleId = data.role_id ? Number(data.role_id) : null;
      const reportingTo = data.reporting_to ? Number(data.reporting_to) : null;

      // 📝 3. Insert user
      const insertUserSQL = `
      INSERT INTO users
        (first_name, last_name, username, password, email, contact_number, 
         date_of_birth, date_of_joining, role_id, reporting_to, 
         status, created_at, updated_at)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,NOW(),NOW())
      RETURNING user_id
    `;

      const userResult = await manager.query(insertUserSQL, [
        data.first_name || null,
        data.last_name || null,
        data.username,
        hashedPassword,
        data.email || null,
        data.contact_number || null,
        data.date_of_birth || null,
        data.date_of_joining || null,
        roleId,
        reportingTo,
      ]);

      const newUserId = userResult[0].user_id;

      // 🏦 4. Insert user details
      const insertDetailsSQL = `
      INSERT INTO user_details
        (user_id, address, city, state, pincode, bank_name, account_number, 
         ifsc_code, branch, created_at, updated_at)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
    `;

      await manager.query(insertDetailsSQL, [
        newUserId,
        data.address || null,
        data.city || null,
        data.state || null,
        data.pincode || null,
        data.bank_name || null,
        data.account_no || null,
        data.ifsc_code || null,
        data.branch || null,
      ]);

      return {
        status: true,
        message: 'User created successfully',
      };
    });
  }

  // Get all users (with optional pagination). Flattens details & hides password.
  async findAll(page?: number, limit?: number) {
    // total count
    const countResult = await this.dataSource.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE status = 1`,
    );
    const totalRecords = countResult?.[0]?.count ?? 0;

    // build query
    let query = `
      SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.username,
        u.email,
        u.contact_number,
        u.date_of_birth,
        u.date_of_joining,
        u.role_id,
        r.role_name,
        d.department_name,
        u.reporting_to,
        rt.first_name AS reporting_to_first,
        rt.last_name AS reporting_to_last,
        ud.id as details_id,
        ud.address,
        ud.city,
        ud.state,
        ud.pincode,
        ud.bank_name,
        ud.account_number,
        ud.ifsc_code,
        ud.branch
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN departments d ON d.department_id = r.department
      LEFT JOIN users rt ON rt.user_id = u.reporting_to
      LEFT JOIN user_details ud ON ud.user_id = u.user_id
      WHERE u.status = 1
      ORDER BY u.user_id ASC
    `;

    const params: any[] = [];
    if (page && limit) {
      const p = Number(page);
      const l = Number(limit);
      const offset = (p - 1) * l;
      query += ` LIMIT $1 OFFSET $2`;
      params.push(l, offset);
    }

    const rows = await this.dataSource.query(query, params);

    const mapped = rows.map((u) => ({
      user_id: u.user_id,
      first_name: u.first_name,
      last_name: u.last_name,
      username: u.username,
      email: u.email,
      contact_number: u.contact_number,
      date_of_birth: u.date_of_birth,
      date_of_joining: u.date_of_joining,
      role: u.role_id ? u.role_id : null,
      role_name: u.role_name || null,
      department: u.department_name || null,
      reporting_to: u.reporting_to
        ? `${u.reporting_to_first} ${u.reporting_to_last}`
        : null,
      // flattened details (not nested)
      address: u.address || null,
      city: u.city || null,
      state: u.state || null,
      pincode: u.pincode || null,
      bank_name: u.bank_name || null,
      account_number: u.account_number || null,
      ifsc_code: u.ifsc_code || null,
      branch: u.branch || null,
    }));

    return {
      status: true,
      message: 'Users fetched successfully',
      data: mapped,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / Number(limit)) : 1,
    };
  }

  // Find by id
  async findById(user_id: number) {
    if (!user_id) throw new BadRequestException('user_id is required');

    const query = `
      SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.username,
        u.email,
        u.contact_number,
        u.date_of_birth,
        u.date_of_joining,
        u.role_id,
        r.role_name,
        d.department_name,
        u.reporting_to,
        rt.first_name AS reporting_to_first,
        rt.last_name AS reporting_to_last,
        ud.id as details_id,
        ud.address,
        ud.city,
        ud.state,
        ud.pincode,
        ud.bank_name,
        ud.account_number,
        ud.ifsc_code,
        ud.branch
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN departments d ON d.department_id = r.department
      LEFT JOIN users rt ON rt.user_id = u.reporting_to
      LEFT JOIN user_details ud ON ud.user_id = u.user_id
      WHERE u.status = 1 AND u.user_id = $1
      LIMIT 1
    `;

    const rows = await this.dataSource.query(query, [user_id]);
    if (!rows.length) throw new BadRequestException('User not found');

    const u = rows[0];

    return {
      status: true,
      message: 'User fetched successfully',
      data: {
        user_id: u.user_id,
        first_name: u.first_name,
        last_name: u.last_name,
        username: u.username,
        email: u.email,
        contact_number: u.contact_number,
        date_of_birth: u.date_of_birth,
        date_of_joining: u.date_of_joining,
        role: u.role_id || null,
        // role_name: u.role_name || null,
        // department: u.department_name || null,
        reporting_to: u.reporting_to ? u.reporting_to : null,
        // flattened details
        address: u.address || null,
        city: u.city || null,
        state: u.state || null,
        pincode: u.pincode || null,
        bank_name: u.bank_name || null,
        account_number: u.account_number || null,
        ifsc_code: u.ifsc_code || null,
        branch: u.branch || null,
      },
    };
  }

  // Update user (transactional). Will update users and user_details (insert if not exists)
  async update(user_id: number, data: any) {
    if (!user_id) throw new BadRequestException('user_id is required');

    return await this.dataSource.transaction(async (manager) => {
      // check exists
      const exist = await manager.query(
        `SELECT user_id FROM users WHERE user_id = $1 AND status = 1 LIMIT 1`,
        [user_id],
      );
      if (!exist.length) throw new BadRequestException('User Not Found');

      // build user update
      const userFields: string[] = [];
      const params: (string | number)[] = [];
      let idx = 1;

      if (data.first_name !== undefined) {
        userFields.push(`first_name = $${idx++}`);
        params.push(data.first_name);
      }
      if (data.last_name !== undefined) {
        userFields.push(`last_name = $${idx++}`);
        params.push(data.last_name);
      }
      if (data.username !== undefined) {
        userFields.push(`username = $${idx++}`);
        params.push(data.username);
      }
      if (data.email !== undefined) {
        userFields.push(`email = $${idx++}`);
        params.push(data.email);
      }
      if (data.contact_number !== undefined) {
        userFields.push(`contact_number = $${idx++}`);
        params.push(data.contact_number);
      }
      if (data.date_of_birth !== undefined) {
        userFields.push(`date_of_birth = $${idx++}`);
        params.push(data.date_of_birth);
      }
      if (data.date_of_joining !== undefined) {
        userFields.push(`date_of_joining = $${idx++}`);
        params.push(data.date_of_joining);
      }
      if (data.role_id !== undefined) {
        userFields.push(`role_id = $${idx++}`);
        params.push(Number(data.role_id));
      }
      if (data.reporting_to !== undefined) {
        userFields.push(`reporting_to = $${idx++}`);
        params.push(data.reporting_to ? data.reporting_to : null);
      }
      if (data.password !== undefined) {
        const hashed = await bcrypt.hash(data.password, 10);
        userFields.push(`password = $${idx++}`);
        params.push(hashed);
      }

      if (userFields.length) {
        params.push(user_id);
        const q = `UPDATE users SET ${userFields.join(', ')}, updated_at = NOW() WHERE user_id = $${idx}`;
        await manager.query(q, params);
      }

      // update details (if any)
      const detailsFields: string[] = [];
      const dparams: (string | number)[] = [];
      let didx = 1;

      if (data.address !== undefined) {
        detailsFields.push(`address = $${didx++}`);
        dparams.push(data.address);
      }
      if (data.city !== undefined) {
        detailsFields.push(`city = $${didx++}`);
        dparams.push(data.city);
      }
      if (data.state !== undefined) {
        detailsFields.push(`state = $${didx++}`);
        dparams.push(data.state);
      }
      if (data.pincode !== undefined) {
        detailsFields.push(`pincode = $${didx++}`);
        dparams.push(data.pincode);
      }
      if (data.bank_name !== undefined) {
        detailsFields.push(`bank_name = $${didx++}`);
        dparams.push(data.bank_name);
      }
      if (data.account_no !== undefined) {
        detailsFields.push(`account_number = $${didx++}`);
        dparams.push(data.account_no);
      }
      if (data.ifsc_code !== undefined) {
        detailsFields.push(`ifsc_code = $${didx++}`);
        dparams.push(data.ifsc_code);
      }
      if (data.branch !== undefined) {
        detailsFields.push(`branch = $${didx++}`);
        dparams.push(data.branch);
      }

      if (detailsFields.length) {
        // check if details row exists
        const detailsExist = await manager.query(
          `SELECT id FROM user_details WHERE user_id = $1 LIMIT 1`,
          [user_id],
        );
        if (detailsExist.length) {
          // update
          dparams.push(user_id);
          const dq = `UPDATE user_details SET ${detailsFields.join(
            ', ',
          )}, updated_at = NOW() WHERE user_id = $${didx}`;
          await manager.query(dq, dparams);
        } else {
          // insert new details row
          const insertDQ = `
            INSERT INTO user_details
              (user_id, ${detailsFields.join(', ')}, status, created_at, updated_at)
            VALUES
              ($${didx}, ${detailsFields
                .map((_, i) => `$${i + 1}`)
                .join(', ')}, 1, NOW(), NOW())
          `;
          // note: build params so that first fields are values then user_id at end
          const insertParams = [...dparams, user_id];
          await manager.query(insertDQ, insertParams);
        }
      }

      return {
        status: true,
        message: 'User Updated successfully',
      };
    });
  }

  // Soft delete user and its details (set status = 0)
  async delete(user_id: number) {
    if (!user_id) throw new BadRequestException('user_id is required');

    await this.dataSource.transaction(async (manager) => {
      const exist = await manager.query(
        `SELECT user_id FROM users WHERE user_id = $1 AND status = 1 LIMIT 1`,
        [user_id],
      );
      if (!exist.length) throw new BadRequestException('User Not Found');

      await manager.query(
        `UPDATE users SET status = 0, updated_at = NOW() WHERE user_id = $1`,
        [user_id],
      );

      await manager.query(
        `UPDATE user_details SET status = 0, updated_at = NOW() WHERE user_id = $1`,
        [user_id],
      );
    });

    return {
      status: true,
      message: 'User deleted successfully',
    };
  }

  // Given a role_id, return users that belong to the role that this role reports to
  async getUsersReportingTo(role_id: number) {
    if (!role_id) throw new BadRequestException('role_id is required');

    // get role and its reports_to
    const r = await this.dataSource.query(
      `SELECT reports_to FROM roles WHERE role_id = $1 AND status = 1 LIMIT 1`,
      [role_id],
    );
    if (!r.length) throw new BadRequestException('Role not found');

    const reportsTo = r[0].reports_to;
    if (reportsTo == null) {
      return {
        status: true,
        message: 'Reporting users fetched successfully',
        data: [],
      };
    }

    // find users with that role_id
    const users = await this.dataSource.query(
      `SELECT user_id, first_name, last_name FROM users WHERE role_id = $1 AND status = 1 ORDER BY user_id ASC`,
      [reportsTo],
    );

    return {
      status: true,
      message: 'Reporting users fetched successfully',
      data: users.map((u) => ({
        user_id: u.user_id,
        name: `${u.first_name} ${u.last_name}`,
      })),
    };
  }

  // Search users
  async search(keyword: string, page?: number, limit?: number) {
    const params: any[] = [`%${keyword}%`]; // for ILIKE
    let query = `
    SELECT
      u.user_id,
      u.first_name,
      u.last_name,
      u.username,
      u.email,
      u.contact_number,
      u.date_of_birth,
      u.date_of_joining,
      u.role_id,
      r.role_name,
      d.department_name,
      u.reporting_to,
      rt.first_name AS reporting_to_first,
      rt.last_name AS reporting_to_last,
      ud.id as details_id,
      ud.address,
      ud.city,
      ud.state,
      ud.pincode,
      ud.bank_name,
      ud.account_number,
      ud.ifsc_code,
      ud.branch
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN departments d ON d.department_id = r.department
    LEFT JOIN users rt ON rt.user_id = u.reporting_to
    LEFT JOIN user_details ud ON ud.user_id = u.user_id
    WHERE u.status = 1
      AND (
        u.first_name ILIKE $1 OR
        u.last_name ILIKE $1 OR
        u.username ILIKE $1 OR
        u.email ILIKE $1 OR
        u.contact_number ILIKE $1
      )
    ORDER BY u.user_id ASC
  `;

    // Pagination
    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const rows = await this.dataSource.query(query, params);

    // Get total records for search
    const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN departments d ON d.department_id = r.department
    LEFT JOIN users rt ON rt.user_id = u.reporting_to
    LEFT JOIN user_details ud ON ud.user_id = u.user_id
    WHERE u.status = 1
      AND (
        u.first_name ILIKE $1 OR
        u.last_name ILIKE $1 OR
        u.username ILIKE $1 OR
        u.email ILIKE $1 OR
        u.contact_number ILIKE $1
      )
  `;

    const totalRecordsResult = await this.dataSource.query(countQuery, [
      `%${keyword}%`,
    ]);
    const totalRecords = totalRecordsResult?.[0]?.count ?? 0;

    const mapped = rows.map((u) => ({
      user_id: u.user_id,
      first_name: u.first_name,
      last_name: u.last_name,
      username: u.username,
      email: u.email,
      contact_number: u.contact_number,
      date_of_birth: u.date_of_birth,
      date_of_joining: u.date_of_joining,
      role: u.role_id || null,
      role_name: u.role_name || null,
      department: u.department_name || null,
      reporting_to: u.reporting_to
        ? `${u.reporting_to_first} ${u.reporting_to_last}`
        : null,
      address: u.address || null,
      city: u.city || null,
      state: u.state || null,
      pincode: u.pincode || null,
      bank_name: u.bank_name || null,
      account_number: u.account_number || null,
      ifsc_code: u.ifsc_code || null,
      branch: u.branch || null,
    }));

    return {
      status: true,
      message:
        page && limit ? 'Paginated Search Results' : 'Full Search Result',
      data: mapped,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / Number(limit)) : 1,
      currentPage: page || 1,
    };
  }

  async filter(filters: any, page?: number, limit?: number) {
    const conditions: string[] = [`u.status = 1`];
    const params: any[] = [];
    let paramIndex = 1;

    // ---------- Dynamic Filters ----------
    if (filters.first_name) {
      conditions.push(`u.first_name ILIKE $${paramIndex++}`);
      params.push(`%${filters.first_name}%`);
    }

    if (filters.last_name) {
      conditions.push(`u.last_name ILIKE $${paramIndex++}`);
      params.push(`%${filters.last_name}%`);
    }

    if (filters.email) {
      conditions.push(`u.email ILIKE $${paramIndex++}`);
      params.push(`%${filters.email}%`);
    }

    if (filters.contact_number) {
      conditions.push(`u.contact_number ILIKE $${paramIndex++}`);
      params.push(`%${filters.contact_number}%`);
    }

    if (filters.role_id) {
      conditions.push(`u.role_id = $${paramIndex++}`);
      params.push(filters.role_id);
    }

    if (filters.department_id) {
      conditions.push(`d.department_id = $${paramIndex++}`);
      params.push(filters.department_id);
    }

    if (filters.reporting_to) {
      conditions.push(`u.reporting_to = $${paramIndex++}`);
      params.push(filters.reporting_to);
    }

    if (filters.from_date && filters.to_date) {
      conditions.push(
        `u.date_of_joining BETWEEN $${paramIndex} AND $${paramIndex + 1}`,
      );
      params.push(filters.from_date, filters.to_date);
      paramIndex += 2;
    } else {
      if (filters.from_date) {
        conditions.push(`u.date_of_joining >= $${paramIndex++}`);
        params.push(filters.from_date);
      }

      if (filters.to_date) {
        conditions.push(`u.date_of_joining <= $${paramIndex++}`);
        params.push(filters.to_date);
      }
    }

    // ---------- Base Query ----------
    let query = `
    SELECT
      u.user_id,
      u.first_name,
      u.last_name,
      u.username,
      u.email,
      u.contact_number,
      u.date_of_birth,
      u.date_of_joining,
      u.role_id,
      r.role_name,
      d.department_name,
      u.reporting_to,
      rt.first_name AS reporting_to_first,
      rt.last_name AS reporting_to_last,
      ud.address,
      ud.city,
      ud.state,
      ud.pincode,
      ud.bank_name,
      ud.account_number,
      ud.ifsc_code,
      ud.branch
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN departments d ON d.department_id = r.department
    LEFT JOIN users rt ON rt.user_id = u.reporting_to
    LEFT JOIN user_details ud ON ud.user_id = u.user_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY u.user_id ASC
  `;

    // ---------- Pagination ----------
    const paginationParams: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      paginationParams.push(limit, offset);
    }

    const finalParams = [...params, ...paginationParams];

    const result = await this.dataSource.query(query, finalParams);

    // ---------- Count Query ----------
    const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN departments d ON d.department_id = r.department
    WHERE ${conditions.join(' AND ')}
  `;

    const totalRecordsResult = await this.dataSource.query(countQuery, params);
    const totalRecords = totalRecordsResult[0]?.count ?? 0;

    return {
      status: true,
      message: 'Filtered User Results',
      data: result,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }
}

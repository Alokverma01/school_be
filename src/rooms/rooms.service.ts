import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RoomsService {
  constructor(readonly dataSource: DataSource) { }

  async create(body) {
    const exist = await this.dataSource.query(
      `SELECT * FROM rooms WHERE branch_id = $1 AND name = $2`,
      [body.branch_id, body.name],
    );

    if (exist.length > 0) {
      throw new BadRequestException('Room already exists for this branch');
    }

    // Insert new room
    const query = `
        INSERT INTO rooms (branch_id, name, type, capacity)
        VALUES ($1, $2, $3, $4)
    `;

    const values = [body.branch_id, body.name, body.type, body.capacity];
    const result = await this.dataSource.query(query, values);

    return {
      status: true,
      message: 'Room created successfully',
      data: result[0],
    };
  }

  async update(room_id: number, body: any) {
    if (!room_id) {
      throw new BadRequestException('room_id is required');
    }

    const exist = await this.dataSource.query(
      `SELECT * FROM rooms WHERE id = $1 AND status = 1`,
      [room_id],
    );

    if (exist.length === 0) {
      throw new BadRequestException('Room not found');
    }

    // Update query
    const query = `
    UPDATE rooms
    SET branch_id = $1,
        name = $2,
        type = $3,
        capacity = $4
    WHERE id = $5
  `;

    const values = [
      body.branch_id,
      body.name,
      body.type,
      body.capacity,
      room_id,
    ];

    const updatedRoom = await this.dataSource.query(query, values);

    return {
      status: true,
      message: 'Room updated successfully',
    };
  }

  async findAll(page?: number, limit?: number) {
    let query = `
      SELECT 
       r.id,
       r.name,
       r.type,
       r.capacity,
       b.branch_name
      FROM rooms r
      LEFT JOIN branches b ON r.branch_id = b.branch_id
      WHERE r.status = 1
      ORDER BY r.id DESC
    `;

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const totalQuery = `SELECT COUNT(*) FROM rooms WHERE status = 1`;

    const data = await this.dataSource.query(query);
    const total = Number((await this.dataSource.query(totalQuery))[0].count);

    return {
      status: true,
      data,
      totalRecords: total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    };
  }

  async findById(room_id: number) {
    if (!room_id) {
      throw new BadRequestException('room_id is required');
    }

    const exist = await this.dataSource.query(
      `SELECT * FROM rooms WHERE id = $1 AND status = 1`,
      [room_id],
    );

    if (exist.length === 0) {
      throw new BadRequestException('Room not found');
    }

    const query = `
      SELECT 
       r.id,
       r.name,
       r.type,
       r.capacity
      FROM rooms r
      WHERE r.id = $1 AND r.status = 1
    `;
    const result = await this.dataSource.query(query, [room_id]);
    return {
      status: true,
      message: 'Room by Id fetched successfully',
      data: result[0],
    };
  }

  async delete(room_id: number) {
    if (!room_id) {
      throw new BadRequestException('room_id is required');
    }

    const exist = await this.dataSource.query(
      `SELECT * FROM rooms WHERE id = $1 AND status = 1`,
      [room_id],
    );

    if (exist.length === 0) {
      throw new BadRequestException('Room not found');
    }

    // Update query
    const query = `
    UPDATE rooms
    SET status = 0
    WHERE id = $1
  `;

    await this.dataSource.query(query, [room_id]);

    return {
      status: true,
      message: 'Room deleted successfully',
    };
  }

  async findByBranchIdAndType(branch_id: number, type?: string) {
    if (!branch_id) {
      throw new BadRequestException('branch_id is required');
    }

    let query = `
      SELECT 
       r.id,
       r.name,
       r.type,
       r.capacity
      FROM rooms r
      WHERE r.branch_id = $1 AND r.status = 1
    `;
    let result = await this.dataSource.query(query, [branch_id]);

    if (type) {
      query += ` AND r.type = $2`;
      result = await this.dataSource.query(query, [branch_id, type]);
    }

    return {
      status: true,
      message: 'Room by Branch Id and Type fetched successfully',
      data: result,
    };

  }

  async searchRooms(keyword: string, page?: number, limit?: number) {
    const params: any[] = [`%${keyword}%`];
    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = `LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
    SELECT 
      r.id,
      r.name,
      r.type,
      r.capacity,
      b.branch_name
    FROM rooms r
    LEFT JOIN branches b ON r.branch_id = b.branch_id
    WHERE r.status = 1
      AND (r.name ILIKE $1 OR r.type ILIKE $1 OR b.branch_name ILIKE $1)
    ORDER BY r.id DESC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const totalQuery = `
    SELECT COUNT(*) AS count
    FROM rooms r
    LEFT JOIN branches b ON r.branch_id = b.branch_id
    WHERE r.status = 1
      AND (r.name ILIKE $1 OR r.type ILIKE $1 OR b.branch_name ILIKE $1)
  `;

    const totalResult = await this.dataSource.query(totalQuery, [
      `%${keyword}%`,
    ]);
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Rooms fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterRooms(filters: any, page?: number, limit?: number) {
    let conditions = 'WHERE r.status = 1';
    const params: any[] = [];
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name ILIKE $${idx++}`;
      params.push(`%${filters.branch_name}%`);
    }

    if (filters.name) {
      conditions += ` AND r.name ILIKE $${idx++}`;
      params.push(`%${filters.name}%`);
    }

    if (filters.type) {
      conditions += ` AND r.type = $${idx++}`;
      params.push(filters.type);
    }

    if (filters.min_capacity) {
      conditions += ` AND r.capacity >= $${idx++}`;
      params.push(filters.min_capacity);
    }

    if (filters.max_capacity) {
      conditions += ` AND r.capacity <= $${idx++}`;
      params.push(filters.max_capacity);
    }

    let pagination = '';
    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    const query = `
      SELECT 
        r.id,
        r.name,
        r.type,
        r.capacity,
        b.branch_name
      FROM rooms r
      LEFT JOIN branches b ON r.branch_id = b.branch_id
      ${conditions}
      ORDER BY r.id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    const countParams =
      page !== undefined && limit !== undefined
        ? params.slice(0, params.length - 2)
        : params;

    const countQuery = `
      SELECT COUNT(*) AS count
      FROM rooms r
      LEFT JOIN branches b ON r.branch_id = b.branch_id
      ${conditions}
    `;

    const totalResult = await this.dataSource.query(countQuery, countParams);
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Filtered rooms fetched successfully',
      data,
      totalRecords,
      totalPages:
        page !== undefined && limit !== undefined
          ? Math.ceil(totalRecords / limit)
          : 1,
    };
  }
}

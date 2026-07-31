import { Injectable, Body, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateHostelAllocationDto, CreateHostelDto } from './hostel.dto';

@Injectable()
export class HostelsService {
  constructor(private dataSource: DataSource) { }

  // create hostel
  async createHostel(body: CreateHostelDto) {
    const query = `
        INSERT INTO hostels (name, branch_id, type, total_rooms, warden_name, date_of_joining, contact_number, aadhar_number, warden_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

    await this.dataSource.query(query, [
      body.name,
      body.branch_id,
      body.type,
      body.total_rooms,
      body.warden_name,
      body.date_of_joining,
      body.contact_number,
      body.aadhar_number,
      body.warden_address,
    ]);

    return {
      status: true,
      message: 'Hostel created successfully',
    };
  }

  // get all hostels
  async getAllHostels(page?: number, limit?: number) {
    let query = `SELECT 
        h.id, h.name, h.branch_id, b.branch_name, h.type, h.total_rooms, h.warden_name, h.date_of_joining, h.contact_number, h.aadhar_number, h.warden_address,
        (SELECT COALESCE(SUM(hr.bed_count), 0) FROM hostel_rooms hr WHERE hr.hostel_id = h.id AND hr.status = 1) as total_beds,
        (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_beds,
        (SELECT COUNT(DISTINCT ha.hostel_room_id) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_rooms
        FROM hostels h
        LEFT JOIN branches b ON h.branch_id = b.branch_id
        WHERE h.status = 1 
        ORDER BY h.id ASC`;

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const hostels = await this.dataSource.query(query);

    const totalRecordsQuery = `SELECT COUNT(*) FROM hostels WHERE status = 1`;
    const totalRecordsResult = await this.dataSource.query(totalRecordsQuery);
    const totalRecords = parseInt(totalRecordsResult[0].count, 10);

    return {
      status: true,
      message: 'Hostels fetched successfully',
      data: hostels,
      totalRecords: totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async getHostelById(hostel_id: number) {
    if (!hostel_id) {
      throw new BadRequestException('hostel_id is required');
    }

    const exist = await this.dataSource.query(
      `SELECT id
            FROM hostels WHERE id = $1 AND status = 1`,
      [hostel_id],
    );

    if (exist.length === 0) {
      throw new BadRequestException('Hostel does not exist with the given id');
    }

    const hostel = await this.dataSource.query(
      `SELECT 
            h.id, h.name, h.branch_id, h.type, h.total_rooms, h.warden_name, h.date_of_joining, h.contact_number, h.aadhar_number, h.warden_address,
            (SELECT COALESCE(SUM(hr.bed_count), 0) FROM hostel_rooms hr WHERE hr.hostel_id = h.id AND hr.status = 1) as total_beds,
            (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_beds,
            (SELECT COUNT(DISTINCT ha.hostel_room_id) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_rooms
            FROM hostels h WHERE h.id = $1 AND h.status = 1`,
      [hostel_id],
    );

    return {
      status: true,
      message: 'Hostel fetched successfully',
      data: hostel[0],
    };
  }

  async getHostelByBranchId(branch_id: number) {
    if (!branch_id) {
      throw new BadRequestException('branch_id is required');
    }
    const hostel = await this.dataSource.query(
      `SELECT 
            h.id, h.name, h.branch_id, h.type, h.total_rooms, h.warden_name, h.date_of_joining, h.contact_number, h.aadhar_number, h.warden_address,
            (SELECT COALESCE(SUM(hr.bed_count), 0) FROM hostel_rooms hr WHERE hr.hostel_id = h.id AND hr.status = 1) as total_beds,
            (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_beds,
            (SELECT COUNT(DISTINCT ha.hostel_room_id) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_rooms
            FROM hostels h WHERE h.branch_id = $1 AND h.status = 1`,
      [branch_id],
    );
    return {
      status: true,
      message: hostel.length ? 'Hostel fetched successfully' : "No hostel found in this branch",
      data: hostel
    };
  }

  async updateHostel(hostel_id: number, body) {
    if (!hostel_id) {
      throw new BadRequestException('hostel_id is required');
    }
    const exist = await this.dataSource.query(
      `SELECT id
            FROM hostels WHERE id = $1 AND status = 1`,
      [hostel_id],
    );
    if (exist.length === 0) {
      throw new BadRequestException('Hostel does not exist with the given id');
    }
    const query = `
            UPDATE hostels
            SET name = $1, branch_id = $2, type = $3, total_rooms = $4, warden_name = $5, date_of_joining = $6, contact_number = $7, aadhar_number = $8, warden_address = $9, 
            updated_at = NOW()
            WHERE id = $10
        `;
    await this.dataSource.query(query, [
      body.name,
      body.branch_id,
      body.type,
      body.total_rooms,
      body.warden_name,
      body.date_of_joining,
      body.contact_number,
      body.aadhar_number,
      body.warden_address,
      hostel_id,
    ]);
    return {
      status: true,
      message: 'Hostel updated successfully',
    };
  }

  async deleteHostel(hostel_id: number) {
    if (!hostel_id) {
      throw new BadRequestException('hostel_id is required');
    }
    const exist = await this.dataSource.query(
      `SELECT id
            FROM hostels WHERE id = $1 AND status = 1`,
      [hostel_id],
    );
    if (exist.length === 0) {
      throw new BadRequestException('Hostel does not exist with the given id');
    }

    const query = `
            UPDATE hostels
            SET status = 0, updated_at = NOW()
            WHERE id = $1
        `;
    await this.dataSource.query(query, [hostel_id]);
    return {
      status: true,
      message: 'Hostel deleted successfully',
    };
  }

  async searchHostels(keyword: string, page?: number, limit?: number) {
    const params: any[] = [`%${keyword}%`];
    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = `LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
    SELECT h.id, h.name, h.branch_id, b.branch_name, h.type, h.total_rooms, h.warden_name, h.date_of_joining, h.contact_number, h.aadhar_number, h.warden_address,
    (SELECT COALESCE(SUM(hr.bed_count), 0) FROM hostel_rooms hr WHERE hr.hostel_id = h.id AND hr.status = 1) as total_beds,
    (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_beds,
    (SELECT COUNT(DISTINCT ha.hostel_room_id) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_rooms
    FROM hostels h
    LEFT JOIN branches b ON h.branch_id = b.branch_id
    WHERE h.status = 1 AND (b.branch_name ILIKE $1 OR h.name ILIKE $1 OR h.warden_name ILIKE $1)
    ORDER BY h.id ASC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const totalQuery = `
    SELECT COUNT(*) AS count
    FROM hostels
    LEFT JOIN branches b ON hostels.branch_id = b.branch_id
    WHERE hostels.status = 1 AND (hostels.name ILIKE $1 OR hostels.warden_name ILIKE $1)
  `;
    const totalRecordsResult = await this.dataSource.query(totalQuery, [
      `%${keyword}%`,
    ]);
    const totalRecords = Number(totalRecordsResult[0].count);

    return {
      status: true,
      message: 'Hostels fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterHostels(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let whereClause = `WHERE h.status = 1`;
    let index = 1;

    if (filters.name) {
      whereClause += ` AND h.name ILIKE $${index++}`;
      params.push(`%${filters.name}%`);
    }

    if (filters.branch_name) {
      whereClause += ` AND b.branch_name ILIKE $${index++}`;
      params.push(filters.branch_name);
    }

    if (filters.type !== undefined && filters.type !== null) {
      whereClause += ` AND h.type = $${index++}`;
      params.push(filters.type);
    }

    if (filters.warden_name) {
      whereClause += ` AND h.warden_name ILIKE $${index++}`;
      params.push(`%${filters.warden_name}%`);
    }

    if (filters.from_date && filters.to_date) {
      whereClause += ` AND h.date_of_joining BETWEEN $${index++} AND $${index++}`;
      params.push(filters.from_date, filters.to_date);
    }

    let pagination = '';
    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = `LIMIT $${index++} OFFSET $${index++}`;
      params.push(limit, offset);
    }

    const query = `
    SELECT h.id, h.name, h.branch_id, b.branch_name, h.type, h.total_rooms, h.warden_name, h.date_of_joining, h.contact_number, h.aadhar_number, h.warden_address,
    (SELECT COALESCE(SUM(hr.bed_count), 0) FROM hostel_rooms hr WHERE hr.hostel_id = h.id AND hr.status = 1) as total_beds,
    (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_beds,
    (SELECT COUNT(DISTINCT ha.hostel_room_id) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_rooms
    FROM hostels h
    LEFT JOIN branches b ON h.branch_id = b.branch_id
    ${whereClause}
    ORDER BY h.id ASC
    ${pagination}`;

    const data = await this.dataSource.query(query, params);

    const totalCountQuery = `SELECT COUNT(*) AS count FROM hostels h
    LEFT JOIN branches b ON h.branch_id = b.branch_id
     ${whereClause}`;
    const totalRecordsResult = await this.dataSource.query(
      totalCountQuery,
      params.slice(0, index - (pagination ? 3 : 1)),
    );

    return {
      status: true,
      message: 'Filtered hostel results',
      data,
      totalRecords: Number(totalRecordsResult[0].count),
      totalPages:
        page && limit ? Math.ceil(totalRecordsResult[0].count / limit) : 1,
    };
  }

  // hostel rooms
  async createRoom(body: any) {
    const query = `
        INSERT INTO hostel_rooms (branch_id, hostel_id, room_number, bed_count)
        VALUES ($1, $2, $3, $4)
        `;

    await this.dataSource.query(query, [
      body.branch_id,
      body.hostel_id,
      body.room_number,
      body.bed_count,
    ]);

    return {
      status: true,
      message: 'Room added successfully',
    };
  }

  async updateRoom(room_id: number, body: any) {
    if (!room_id) {
      throw new BadRequestException('room_id is required');
    }
    const exist = await this.dataSource.query(
      `SELECT id
            FROM hostel_rooms WHERE id = $1 AND status = 1`,
      [room_id],
    );
    if (exist.length === 0) {
      throw new BadRequestException('Room does not exist with the given id');
    }
    const query = `
            UPDATE hostel_rooms
            SET branch_id = $1, hostel_id = $2, room_number = $3, bed_count = $4, updated_at = NOW()
            WHERE id = $5
        `;

    await this.dataSource.query(query, [
      body.branch_id,
      body.hostel_id,
      body.room_number,
      body.bed_count,
      room_id,
    ]);

    return {
      status: true,
      message: 'Room updated successfully',
    };
  }

  async getAllRooms(page?: number, limit?: number) {
    let query = `
    SELECT 
    hr.id,
    hr.branch_id,
    b.branch_name,
    hr.hostel_id,
    h.name AS hostel_name,
    hr.room_number,
    hr.bed_count,
    (hr.bed_count - (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_room_id = hr.id AND ha.status = 1)) as remaining_bed_count
    FROM hostel_rooms hr
    LEFT JOIN hostels h ON hr.hostel_id = h.id
    LEFT JOIN branches b ON hr.branch_id = b.branch_id
    WHERE hr.status = 1
    ORDER BY hr.id ASC
    `;

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const rooms = await this.dataSource.query(query);

    const totalRecordsQuery = `SELECT COUNT(*) FROM hostel_rooms WHERE status = 1`;
    const totalRecordsResult = await this.dataSource.query(totalRecordsQuery);
    const totalRecords = parseInt(totalRecordsResult[0].count, 10);

    return {
      status: true,
      message: 'Hostel rooms fetched successfully',
      data: rooms,
      totalRecords: totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async getRoomById(room_id: number) {
    if (!room_id) {
      throw new BadRequestException('room_id is required');
    }

    const exist = await this.dataSource.query(
      `SELECT id
            FROM hostel_rooms WHERE id = $1 AND status = 1`,
      [room_id],
    );

    if (exist.length === 0) {
      throw new BadRequestException('Room does not exist with the given id');
    }
    const room = await this.dataSource.query(
      `SELECT 
      hr.id,
      hr.branch_id,
      hr.hostel_id,
      hr.room_number,
      hr.bed_count,
      (hr.bed_count - (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_room_id = hr.id AND ha.status = 1)) as remaining_bed_count
      FROM hostel_rooms hr
      WHERE hr.id = $1 AND hr.status = 1`,
      [room_id],
    );

    return {
      status: true,
      message: 'Hostel room fetched successfully',
      data: room[0],
    };
  }

  async getHostelRoomByHostelId(hostel_id: number) {
    if (!hostel_id) {
      throw new BadRequestException('hostel_id is required');
    }

    const rooms = await this.dataSource.query(
      `SELECT 
      hr.id,
      hr.branch_id,
      hr.hostel_id,
      hr.room_number,
      hr.bed_count,
      (hr.bed_count - (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_room_id = hr.id AND ha.status = 1)) as remaining_bed_count
      FROM hostel_rooms hr
      WHERE hr.hostel_id = $1 AND hr.status = 1`,
      [hostel_id],
    );

    return {
      status: true,
      message: rooms.length ? 'Hostel room fetched successfully' : "No rooms found in this hostel",
      data: rooms,
    };
  }

  async deleteRoom(room_id: number) {
    if (!room_id) {
      throw new BadRequestException('room_id is required');
    }
    const exist = await this.dataSource.query(
      `SELECT id
            FROM hostel_rooms WHERE id = $1 AND status = 1`,
      [room_id],
    );
    if (exist.length === 0) {
      throw new BadRequestException('Room does not exist with the given id');
    }
    const query = `
            UPDATE hostel_rooms 
            SET status = 0, updated_at = NOW()
            WHERE id = $1
        `;
    await this.dataSource.query(query, [room_id]);

    return {
      status: true,
      message: 'Hostel room deleted successfully',
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
    SELECT hr.id, hr.branch_id,b.branch_name, hr.hostel_id, h.name AS hostel_name, hr.room_number, hr.bed_count,
    (hr.bed_count - (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_room_id = hr.id AND ha.status = 1)) as remaining_bed_count
    FROM hostel_rooms hr
    LEFT JOIN hostels h ON hr.hostel_id = h.id
    LEFT JOIN branches b ON hr.branch_id = b.branch_id
    WHERE hr.status = 1 AND (hr.room_number::text ILIKE $1 OR h.name ILIKE $1)
    ORDER BY hr.id ASC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const totalQuery = `
    SELECT COUNT(*) AS count
    FROM hostel_rooms hr
    LEFT JOIN hostels h ON hr.hostel_id = h.id
    LEFT JOIN branches b ON hr.branch_id = b.branch_id
    WHERE hr.status = 1 AND (hr.room_number::text ILIKE $1 OR h.name ILIKE $1)
  `;
    const totalRecordsResult = await this.dataSource.query(totalQuery, [
      `%${keyword}%`,
    ]);
    const totalRecords = Number(totalRecordsResult[0].count);

    return {
      status: true,
      message: 'Hostel rooms fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterRooms(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let whereClause = `WHERE hr.status = 1`;
    let index = 1;

    if (filters.branch_name) {
      whereClause += ` AND b.branch_name ILIKE $${index++}`;
      params.push(`${filters.branch_name}`);
    }

    if (filters.hostel_name) {
      whereClause += ` AND h.name ILIKE $${index++}`;
      params.push(`${filters.hostel_name}`);
    }

    if (filters.room_number) {
      whereClause += ` AND hr.room_number::text ILIKE $${index++}`;
      params.push(`%${filters.room_number}%`);
    }

    if (filters.bed_count) {
      whereClause += ` AND hr.bed_count = $${index++}`;
      params.push(filters.bed_count);
    }

    let pagination = '';
    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = `LIMIT $${index++} OFFSET $${index++}`;
      params.push(limit, offset);
    }

    const query = `
    SELECT hr.id, hr.branch_id,b.branch_name, hr.hostel_id, h.name AS hostel_name, hr.room_number, hr.bed_count,
    (hr.bed_count - (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_room_id = hr.id AND ha.status = 1)) as remaining_bed_count
    FROM hostel_rooms hr
    LEFT JOIN branches b ON hr.branch_id = b.branch_id
    LEFT JOIN hostels h ON hr.hostel_id = h.id
    ${whereClause}
    ORDER BY hr.id DESC
    ${pagination}`;

    const data = await this.dataSource.query(query, params);

    const totalCountQuery = `SELECT COUNT(*) AS count 
      FROM hostel_rooms hr LEFT JOIN hostels h ON hr.hostel_id = h.id
      LEFT JOIN branches b ON hr.branch_id = b.branch_id
       ${whereClause}`;

    const totalRecordsResult = await this.dataSource.query(
      totalCountQuery,
      params.slice(0, index - (pagination ? 3 : 1)),
    );

    return {
      status: true,
      message: 'Filtered room results',
      data,
      totalRecords: Number(totalRecordsResult[0].count),
      totalPages:
        page && limit ? Math.ceil(totalRecordsResult[0].count / limit) : 1,
    };
  }

  // room allocations
  async allocateRoom(body: CreateHostelAllocationDto) {

    // Fetch total capacity and current allocation count
    const roomInfo = await this.dataSource.query(
      `SELECT 
         hr.bed_count, 
         (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_room_id = hr.id AND ha.status = 1) as allocated_count
       FROM hostel_rooms hr 
       WHERE hr.id = $1 AND hr.status = 1`,
      [body.hostel_room_id],
    );

    if (roomInfo.length === 0) {
      throw new BadRequestException('Room not found');
    }

    const capacity = roomInfo[0].bed_count;
    const currentAllocations = parseInt(roomInfo[0].allocated_count, 10);

    if (currentAllocations >= capacity) {
      throw new BadRequestException('Room does not have enough capacity');
    }

    const query = `
        INSERT INTO hostel_allocations (branch_id, hostel_id, hostel_room_id, class_id, section_id, student_id, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await this.dataSource.query(query, [
      body.branch_id,
      body.hostel_id,
      body.hostel_room_id,
      body.class_id,
      body.section_id,
      body.student_id,
      body.start_date,
      body.end_date,
    ]);

    // Removed decrement of bed_count. bed_count now represents total capacity.

    return {
      status: true,
      message: 'Room allocated successfully',
    };
  }

  async updateAllocation(allocation_id: number, body) {
    if (!allocation_id) {
      throw new BadRequestException('allocation_id is required');
    }

    const exist = await this.dataSource.query(
      `SELECT id
                FROM hostel_allocations WHERE id = $1 AND status = 1`,
      [allocation_id],
    );

    if (exist.length === 0) {
      throw new BadRequestException(
        'Allocation does not exist with the given id',
      );
    }
    const query = `
                UPDATE hostel_allocations
                SET branch_id = $1, hostel_id = $2, hostel_room_id = $3, class_id = $4, section_id = $5, student_id = $6, start_date = $7, end_date = $8, updated_at = NOW()
                WHERE id = $9
        `;

    await this.dataSource.query(query, [
      body.branch_id,
      body.hostel_id,
      body.hostel_room_id,
      body.class_id,
      body.section_id,
      body.student_id,
      body.start_date,
      body.end_date,
      allocation_id,
    ]);

    return {
      status: true,
      message: 'Hostel allocation updated successfully',
    };
  }

  async getAllAllocations(page?: number, limit?: number) {
    let query = `
    SELECT 
    ha.id,
    b.branch_name,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    hr.room_number,
    h.name AS hostel_name,
    c.class_name AS class_name,
    sec.section_name AS section_name,
    ha.start_date,
    ha.end_date
    FROM hostel_allocations ha
    LEFT JOIN hostel_rooms hr ON ha.hostel_room_id = hr.id
    LEFT JOIN hostels h ON ha.hostel_id = h.id
    LEFT JOIN branches b ON ha.branch_id = b.branch_id
    LEFT JOIN students s ON ha.student_id = s.student_id
    LEFT JOIN classes c ON ha.class_id = c.class_id
    LEFT JOIN sections sec ON ha.section_id = sec.section_id
    WHERE ha.status = 1
    ORDER BY ha.id DESC
    `;

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const allocations = await this.dataSource.query(query);

    const totalRecordsQuery = `SELECT COUNT(*) FROM hostel_allocations WHERE status = 1`;
    const totalRecordsResult = await this.dataSource.query(totalRecordsQuery);
    const totalRecords = parseInt(totalRecordsResult[0].count, 10);

    return {
      status: true,
      message: 'Hostel allocations fetched successfully',
      data: allocations,
      totalRecords: totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async getAllocationById(allocation_id: number) {
    if (!allocation_id) {
      throw new BadRequestException('allocation_id is required');
    }

    const exist = await this.dataSource.query(
      `SELECT id
            FROM hostel_allocations WHERE id = $1 AND status = 1`,
      [allocation_id],
    );
    if (exist.length === 0) {
      throw new BadRequestException(
        'Allocation does not exist with the given id',
      );
    }
    const allocation = await this.dataSource.query(
      `SELECT 
      ha.id,
      ha.branch_id,
      ha.hostel_id,
      ha.hostel_room_id,
      ha.class_id,
      ha.section_id,
      ha.student_id,
      ha.start_date,
      ha.end_date
      FROM hostel_allocations ha
      WHERE ha.id = $1 AND ha.status = 1`,
      [allocation_id],
    );

    return {
      status: true,
      message: 'Hostel allocation fetched successfully',
      data: allocation[0],
    };
  }

  async deleteAllocation(allocation_id: number) {
    if (!allocation_id) {
      throw new BadRequestException('allocation_id is required');
    }


    const exist = await this.dataSource.query(
      `SELECT id
            FROM hostel_allocations WHERE id = $1 AND status = 1`,
      [allocation_id],
    );


    if (exist.length === 0) {
      throw new BadRequestException(
        'Allocation does not exist with the given id',
      );
    }

    const query = `
            UPDATE hostel_allocations
            SET status = 0, updated_at = NOW()
            WHERE id = $1
        `;
    await this.dataSource.query(query, [allocation_id]);

    return {
      status: true,
      message: 'Hostel allocation deleted successfully',
    };
  }

  async searchAllocations(keyword: string, page?: number, limit?: number) {
    const params: any[] = [`%${keyword}%`];
    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = `LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
    SELECT ha.id, ha.branch_id, ha.hostel_id, ha.class_id, ha.section_id, ha.student_id, 
           CONCAT(s.first_name, ' ', s.last_name) AS student_name,
           ha.hostel_room_id, hr.room_number, h.name AS hostel_name, 
           c.class_name AS class_name, sec.section_name AS section_name,
           ha.start_date, ha.end_date
    FROM hostel_allocations ha
    LEFT JOIN hostel_rooms hr ON ha.hostel_room_id = hr.id
    LEFT JOIN hostels h ON ha.hostel_id = h.id
    LEFT JOIN students s ON ha.student_id = s.student_id
    LEFT JOIN classes c ON ha.class_id = c.class_id
    LEFT JOIN sections sec ON ha.section_id = sec.section_id
    WHERE ha.status = 1 AND 
          (s.first_name ILIKE $1 OR s.last_name ILIKE $1 OR h.name ILIKE $1 OR hr.room_number::text ILIKE $1)
    ORDER BY ha.id DESC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const totalQuery = `
    SELECT COUNT(*) AS count
    FROM hostel_allocations ha
    LEFT JOIN hostel_rooms hr ON ha.hostel_room_id = hr.id
    LEFT JOIN hostels h ON ha.hostel_id = h.id
    LEFT JOIN students s ON ha.student_id = s.student_id
    WHERE ha.status = 1 AND 
          (s.first_name ILIKE $1 OR s.last_name ILIKE $1 OR h.name ILIKE $1 OR hr.room_number::text ILIKE $1)
  `;
    const totalRecordsResult = await this.dataSource.query(totalQuery, [
      `%${keyword}%`,
    ]);
    const totalRecords = Number(totalRecordsResult[0].count);

    return {
      status: true,
      message: 'Hostel allocations fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterAllocations(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let whereClause = `WHERE ha.status = 1`;
    let index = 1;

    if (filters.branch_id) {
      whereClause += ` AND ha.branch_id = $${index++}`;
      params.push(filters.branch_id);
    }

    if (filters.hostel_id) {
      whereClause += ` AND ha.hostel_id = $${index++}`;
      params.push(filters.hostel_id);
    }

    if (filters.class_id) {
      whereClause += ` AND ha.class_id = $${index++}`;
      params.push(filters.class_id);
    }

    if (filters.section_id) {
      whereClause += ` AND ha.section_id = $${index++}`;
      params.push(filters.section_id);
    }

    if (filters.student_name) {
      whereClause += ` AND (s.first_name ILIKE $${index} OR s.last_name ILIKE $${index})`;
      params.push(`%${filters.student_name}%`);
      index++;
    }

    if (filters.hostel_name) {
      whereClause += ` AND h.name ILIKE $${index++}`;
      params.push(`%${filters.hostel_name}%`);
    }

    if (filters.room_number) {
      whereClause += ` AND hr.room_number::text ILIKE $${index++}`;
      params.push(`%${filters.room_number}%`);
    }

    if (filters.from_date && filters.to_date) {
      whereClause += ` AND ha.start_date BETWEEN $${index++} AND $${index++}`;
      params.push(filters.from_date, filters.to_date);
    }

    let pagination = '';
    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = `LIMIT $${index++} OFFSET $${index++}`;
      params.push(limit, offset);
    }

    const query = `
    SELECT ha.id, ha.branch_id, ha.hostel_id, ha.class_id, ha.section_id, ha.student_id, 
           CONCAT(s.first_name, ' ', s.last_name) AS student_name,
           ha.hostel_room_id, hr.room_number, h.name AS hostel_name,
           c.class_name AS class_name, sec.section_name AS section_name,
           ha.start_date, ha.end_date
    FROM hostel_allocations ha
    LEFT JOIN hostel_rooms hr ON ha.hostel_room_id = hr.id
    LEFT JOIN hostels h ON ha.hostel_id = h.id
    LEFT JOIN students s ON ha.student_id = s.student_id
    LEFT JOIN classes c ON ha.class_id = c.class_id
    LEFT JOIN sections sec ON ha.section_id = sec.section_id
    ${whereClause}
    ORDER BY ha.id DESC
    ${pagination}`;

    const data = await this.dataSource.query(query, params);

    const totalCountQuery = `
    SELECT COUNT(*) AS count 
    FROM hostel_allocations ha
    LEFT JOIN hostel_rooms hr ON ha.hostel_room_id = hr.id
    LEFT JOIN hostels h ON ha.hostel_id = h.id
    LEFT JOIN students s ON ha.student_id = s.student_id
    LEFT JOIN classes c ON ha.class_id = c.class_id
    LEFT JOIN sections sec ON ha.section_id = sec.section_id
    ${whereClause}`;

    const totalRecordsResult = await this.dataSource.query(
      totalCountQuery,
      params.slice(0, index - (pagination ? 3 : 1)),
    );

    return {
      status: true,
      message: 'Filtered allocation results',
      data,
      totalRecords: Number(totalRecordsResult[0].count),
      totalPages:
        page && limit ? Math.ceil(totalRecordsResult[0].count / limit) : 1,
    };
  }
}

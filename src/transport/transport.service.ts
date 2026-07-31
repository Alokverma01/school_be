import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CreateVehicleDto,
  CreateRouteDto,
  AssignStudentTransportDto,
} from './transport.dto';

@Injectable()
export class TransportService {
  constructor(private readonly dataSource: DataSource) { }

  // CREATE
  async createDriver(dto: any) {
    const now = new Date();

    const query = `
      INSERT INTO drivers
      (branch_id, name, mobile, aadhar_no, address, emergency_contact_mobile, license_no, license_issue_date, license_expiry_date, joining_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, $11, $11)
    `;

    const values = [
      dto.branch_id,
      dto.name?.trim(),
      dto.mobile?.trim(),
      dto.aadhar_no?.trim(),
      dto.address?.trim(),
      dto.emergency_contact_mobile?.trim(),
      dto.license_no?.trim(),
      dto.license_issue_date,
      dto.license_expiry_date,
      dto.joining_date,
      now,
    ];

    try {
      await this.dataSource.query(query, values);
      return { status: true, message: 'Driver added successfully' };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to add driver');
    }
  }

  // UPDATE
  async updateDriver(driver_id: number, dto: any) {
    if (!driver_id) throw new BadRequestException('driver_id is required');

    const exists = await this.dataSource.query(
      `SELECT driver_id FROM drivers WHERE driver_id = $1 AND status = 1`,
      [driver_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    const query = `
      UPDATE drivers
      SET
        branch_id = $1,
        name = $2,
        mobile = $3,
        aadhar_no = $4,
        address = $5,
        emergency_contact_mobile = $6,
        license_no = $7,
        license_issue_date = $8,
        license_expiry_date = $9,
        joining_date = $10,
        updated_at = NOW()
      WHERE driver_id = $11
    `;

    const values = [
      dto.branch_id,
      dto.name?.trim(),
      dto.mobile?.trim(),
      dto.aadhar_no?.trim(),
      dto.address?.trim(),
      dto.emergency_contact_mobile?.trim(),
      dto.license_no?.trim(),
      dto.license_issue_date,
      dto.license_expiry_date,
      dto.joining_date,
      driver_id,
    ];

    await this.dataSource.query(query, values);

    return { status: true, message: 'Driver updated successfully' };
  }

  // GET ALL (WITH PAGINATION)
  async getAllDrivers(page?: number, limit?: number) {
    let baseQuery = `
      SELECT 
        d.driver_id,
        d.branch_id,
        b.branch_name,
        d.name,
        d.mobile,
        d.aadhar_no,
        d.address,
        d.emergency_contact_mobile,
        d.license_no,
        d.license_issue_date,
        d.license_expiry_date,
        d.joining_date
      FROM drivers d
      LEFT JOIN branches b ON b.branch_id = d.branch_id
      WHERE d.status = 1
      ORDER BY d.driver_id DESC
    `;

    const params: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(baseQuery, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM drivers WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Drivers fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // GET BY ID
  async getDriverById(driver_id: number) {
    if (!driver_id) throw new BadRequestException('driver_id is required');

    const query = `
      SELECT 
        d.driver_id,
        d.branch_id,
        b.branch_name,
        d.name,
        d.mobile,
        d.aadhar_no,
        d.address,
        d.emergency_contact_mobile,
        d.license_no,
        d.license_issue_date,
        d.license_expiry_date,
        d.joining_date
      FROM drivers d
      LEFT JOIN branches b ON b.branch_id = d.branch_id
      WHERE d.driver_id = $1 AND d.status = 1
    `;

    const result = await this.dataSource.query(query, [driver_id]);

    if (result.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    return {
      status: true,
      message: 'Driver fetched successfully',
      data: result[0],
    };
  }

  async getDriverByBranchId(branch_id: number) {
    if (!branch_id) throw new BadRequestException('branch_id is required');

    const query = `
      SELECT 
        d.driver_id,
        d.branch_id,
        b.branch_name,
        d.name,
        d.mobile,
        d.aadhar_no,
        d.address,
        d.emergency_contact_mobile,
        d.license_no,
        d.license_issue_date,
        d.license_expiry_date,
        d.joining_date
      FROM drivers d
      LEFT JOIN branches b ON b.branch_id = d.branch_id
      WHERE d.driver_id = $1 AND d.status = 1
    `;

    const result = await this.dataSource.query(query, [branch_id]);

    if (result.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    return {
      status: true,
      message: 'Driver By branch ID fetched successfully',
      data: result,
    };
  }

  // SOFT DELETE
  async deleteDriver(driver_id: number) {
    if (!driver_id) throw new BadRequestException('driver_id is required');

    const exists = await this.dataSource.query(
      `SELECT driver_id FROM drivers WHERE driver_id = $1 AND status = 1`,
      [driver_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    await this.dataSource.query(
      `UPDATE drivers SET status = 0, updated_at = NOW() WHERE driver_id = $1`,
      [driver_id],
    );

    return { status: true, message: 'Driver deleted successfully' };
  }

  // SEARCH
  async searchDrivers(keyword: string, page?: number, limit?: number) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];
    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
      SELECT 
        d.driver_id,
        d.branch_id,
        b.branch_name,
        d.name,
        d.mobile,
        d.aadhar_no,
        d.address,
        d.emergency_contact_mobile,
        d.license_no,
        d.license_issue_date,
        d.license_expiry_date,
        d.joining_date
      FROM drivers d
      LEFT JOIN branches b ON b.branch_id = d.branch_id
      WHERE d.status = 1
        AND (
          d.name ILIKE $1
          OR d.mobile ILIKE $1
          OR d.aadhar_no ILIKE $1
          OR d.license_no ILIKE $1
          OR b.branch_name ILIKE $1
          OR TO_CHAR(d.license_issue_date, 'YYYY-MM-DD') ILIKE $1
          OR TO_CHAR(d.license_expiry_date, 'YYYY-MM-DD') ILIKE $1
          OR TO_CHAR(d.joining_date, 'YYYY-MM-DD') ILIKE $1
        )
      ORDER BY d.driver_id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM drivers d
      LEFT JOIN branches b ON b.branch_id = d.branch_id
      WHERE d.status = 1
        AND (
          d.name ILIKE $1
          OR d.mobile ILIKE $1
          OR d.aadhar_no ILIKE $1
          OR d.license_no ILIKE $1
          OR b.branch_name ILIKE $1
          OR TO_CHAR(d.license_issue_date, 'YYYY-MM-DD') ILIKE $1
          OR TO_CHAR(d.license_expiry_date, 'YYYY-MM-DD') ILIKE $1
          OR TO_CHAR(d.joining_date, 'YYYY-MM-DD') ILIKE $1
        )
    `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Driver search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // FILTER (example - extend as needed)
  async filterDrivers(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE d.status = 1`;
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name = $${idx++}`;
      params.push(filters.branch_name);
    }

    if (filters.name?.trim()) {
      conditions += ` AND d.name ILIKE $${idx++}`;
      params.push(`%${filters.name.trim()}%`);
    }

    if (filters.mobile?.trim()) {
      conditions += ` AND d.mobile ILIKE $${idx++}`;
      params.push(`%${filters.mobile.trim()}%`);
    }

    if (filters.license_no?.trim()) {
      conditions += ` AND d.license_no ILIKE $${idx++}`;
      params.push(`%${filters.license_no.trim()}%`);
    }

    const baseQuery = `
      SELECT 
        d.driver_id,
        d.branch_id,
        b.branch_name,
        d.name,
        d.mobile,
        d.aadhar_no,
        d.address,
        d.emergency_contact_mobile,
        d.license_no,
        d.license_issue_date,
        d.license_expiry_date,
        d.joining_date
      FROM drivers d
      LEFT JOIN branches b ON b.branch_id = d.branch_id
      ${conditions}
      ORDER BY d.driver_id DESC
    `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Drivers filtered successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;
    const paginatedQuery = baseQuery + ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const data = await this.dataSource.query(paginatedQuery, params);

    const countQuery = `SELECT COUNT(*) FROM drivers d 
      LEFT JOIN branches b ON b.branch_id = d.branch_id
    ${conditions}`;
    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Drivers filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  /* ---------- VEHICLE ---------- */
  async findAllDrivers() {
    const data = await this.dataSource.query(`
    SELECT
      u.user_id AS driver_id,
      CONCAT(u.first_name, ' ', u.last_name) AS driver_name
    FROM users u
    INNER JOIN roles r ON r.role_id = u.role_id
    WHERE u.status = 1
      AND r.role_name = 'driver'
    ORDER BY driver_name ASC
  `);

    return {
      status: true,
      message: 'Drivers fetched successfully',
      data,
    };
  }

  async createVehicle(dto: CreateVehicleDto) {
    const exist = await this.dataSource.query(
      `SELECT vehicle_id FROM vehicles WHERE vehicle_no = $1`,
      [dto.vehicle_no],
    );

    if (exist.length > 0) {
      throw new BadRequestException('Vehicle already exist');
    }

    // Check if driver is already assigned to another vehicle
    const driverAssigned = await this.dataSource.query(
      `SELECT vehicle_id, vehicle_no FROM vehicles WHERE driver_id = $1 AND status = 1`,
      [dto.driver_id],
    );

    if (driverAssigned.length > 0) {
      throw new BadRequestException(
        `Driver is already assigned to vehicle ${driverAssigned[0].vehicle_no}`,
      );
    }

    await this.dataSource.query(
      `
       INSERT INTO vehicles
       (branch_id , vehicle_no, vehicle_type_id, capacity, driver_id, maintenance_due_date, insurance_expiry, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,1)
      `,
      [
        dto.branch_id,
        dto.vehicle_no,
        dto.vehicle_type_id,
        dto.capacity,
        dto.driver_id,
        dto.maintenance_due_date ?? null,
        dto.insurance_expiry ?? null,
      ],
    );

    return {
      status: true,
      message: 'Vehicle Created Successfully',
    };
  }

  async updateVehicle(vehicle_id: number, dto: any) {
    if (!vehicle_id) {
      throw new BadRequestException('id is required');
    }

    const check = await this.dataSource.query(
      `SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1 AND status = 1`,
      [vehicle_id],
    );

    if (check.length === 0) {
      throw new BadRequestException('Vehicle not found');
    }

    const exist = await this.dataSource.query(
      `SELECT vehicle_id FROM vehicles 
      WHERE vehicle_no = $1 AND vehicle_id != $2 AND status = 1
    `,
      [dto.vehicle_no, vehicle_id],
    );

    if (exist.length > 0) {
      throw new BadRequestException('Vehicle number already exists');
    }

    // Check if driver is already assigned to another vehicle (excluding current)
    const driverAssigned = await this.dataSource.query(
      `SELECT vehicle_id, vehicle_no FROM vehicles 
     WHERE driver_id = $1 AND vehicle_id != $2 AND status = 1`,
      [dto.driver_id, vehicle_id],
    );

    if (driverAssigned.length > 0) {
      throw new BadRequestException(
        `Driver is already assigned to vehicle ${driverAssigned[0].vehicle_no}`,
      );
    }

    await this.dataSource.query(
      `
    UPDATE vehicles SET
      branch_id = $1,
      vehicle_no = $2,
      vehicle_type_id = $3,
      capacity = $4,
      driver_id = $5,
      maintenance_due_date = $6,
      insurance_expiry = $7,
      updated_at = NOW()
    WHERE vehicle_id = $8
    `,
      [
        dto.branch_id,
        dto.vehicle_no,
        dto.vehicle_type_id,
        dto.capacity,
        dto.driver_id,
        dto.maintenance_due_date,
        dto.insurance_expiry,
        vehicle_id,
      ],
    );

    return {
      status: true,
      message: 'Vehicle updated successfully',
    };
  }

  async getVehicleById(vehicle_id: number) {
    if (!vehicle_id) {
      throw new BadRequestException('id is required');
    }

    const check = await this.dataSource.query(
      `SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1 AND status = 1`,
      [vehicle_id],
    );

    if (check.length === 0) {
      throw new BadRequestException('Vehicle not found');
    }

    const query = `
    SELECT 
      v.vehicle_id,
      v.branch_id,
      v.vehicle_no,
      v.vehicle_type_id,
      v.capacity,
      v.driver_id,
      v.maintenance_due_date,
      v.insurance_expiry
    FROM vehicles v
    WHERE v.vehicle_id = $1 AND v.status = 1
  `;

    const result = await this.dataSource.query(query, [vehicle_id]);

    if (result.length === 0) {
      throw new BadRequestException('Vehicle not found');
    }

    return {
      status: true,
      message: 'Vehicle fetched successfully',
      data: result[0],
    };
  }

  async getVehicleByBranchId(branch_id: number) {
    if (!branch_id) {
      throw new BadRequestException('id is required');
    }

    const check = await this.dataSource.query(
      `SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1 AND status = 1`,
      [branch_id],
    );

    if (check.length === 0) {
      throw new BadRequestException('Vehicle not found');
    }

    const query = `
    SELECT 
      v.vehicle_id,
      v.branch_id,
      v.vehicle_no,
      v.vehicle_type_id,
      v.capacity,
      v.driver_id,
      v.maintenance_due_date,
      v.insurance_expiry
    FROM vehicles v
    WHERE v.branch_id = $1 AND v.status = 1
  `;

    const result = await this.dataSource.query(query, [branch_id]);

    if (result.length === 0) {
      throw new BadRequestException('Vehicle not found');
    }

    return {
      status: true,
      message: 'Vehicle by branch fetched successfully',
      data: result,
    };
  }

  async getAllVehicles(page?: number, limit?: number) {
    let baseQuery = `
    SELECT 
      v.vehicle_id,
      v.branch_id,
      b.branch_name,
      v.vehicle_no,
      v.vehicle_type_id,
      vt.vehicle_type,
      v.capacity,
      v.driver_id,
      d.name,
      v.maintenance_due_date,
      v.insurance_expiry
    FROM vehicles v
    LEFT JOIN branches b ON b.branch_id = v.branch_id
    LEFT JOIN drivers d ON d.driver_id = v.driver_id
    LEFT JOIN vehicle_types vt ON vt.vehicle_type_id = v.vehicle_type_id
    WHERE v.status = 1
    ORDER BY v.vehicle_id ASC
  `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery);
      return {
        status: true,
        message: 'Vehicles fetched successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) FROM vehicles WHERE status=1`;
    const countRes = await this.dataSource.query(countQuery);
    const total = Number(countRes[0].count);

    baseQuery += ` LIMIT $1 OFFSET $2`;
    const data = await this.dataSource.query(baseQuery, [limit, offset]);

    return {
      status: true,
      message: 'Paginanted Vehicles fetched successfully',
      data,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteVehicle(vehicle_id: number) {
    if (!vehicle_id) {
      throw new BadRequestException('id is required');
    }

    const check = await this.dataSource.query(
      `SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1 AND status = 1`,
      [vehicle_id],
    );

    if (check.length === 0) {
      throw new BadRequestException('Vehicle not found');
    }

    await this.dataSource.query(
      `
    UPDATE vehicles
    SET status = 0, updated_at = NOW()
    WHERE vehicle_id = $1
    `,
      [vehicle_id],
    );

    return {
      status: true,
      message: 'Vehicle deleted successfully',
    };
  }

  async searchVehicles(keyword: string, page?: number, limit?: number) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];
    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
    SELECT 
      v.vehicle_id,
      v.branch_id,
      b.branch_name,
      v.vehicle_no,
      v.vehicle_type_id,
      vt.vehicle_type,
      v.capacity,
      v.driver_id,
      d.name,
      v.maintenance_due_date,
      v.insurance_expiry
    FROM vehicles v
    LEFT JOIN branches b ON b.branch_id = v.branch_id
    LEFT JOIN drivers d ON d.driver_id = v.driver_id
    LEFT JOIN vehicle_types vt ON vt.vehicle_type_id = v.vehicle_type_id
    WHERE v.status = 1
      AND (
        v.vehicle_no ILIKE $1
        OR b.branch_name ILIKE $1
        OR vt.vehicle_type ILIKE $1
        OR d.name ILIKE $1
      )
    ORDER BY v.vehicle_id DESC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
    SELECT COUNT(*)
    FROM vehicles v
    LEFT JOIN branches b ON b.branch_id = v.branch_id
    LEFT JOIN drivers d ON d.driver_id = v.driver_id
    LEFT JOIN vehicle_types vt ON vt.vehicle_type_id = v.vehicle_type_id
    WHERE v.status = 1
      AND (
        v.vehicle_no ILIKE $1
        OR b.branch_name ILIKE $1
        OR vt.vehicle_type ILIKE $1
        OR d.name ILIKE $1
      )
  `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Vehicles search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterVehicles(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE v.status = 1`;
    let idx = 1;

    if (filters.branch_name?.trim()) {
      conditions += ` AND b.branch_name ILIKE $${idx++}`;
      params.push(`%${filters.branch_name.trim()}%`);
    }

    if (filters.vehicle_no?.trim()) {
      conditions += ` AND v.vehicle_no ILIKE $${idx++}`;
      params.push(`%${filters.vehicle_no.trim()}%`);
    }

    if (filters.vehicle_type) {
      conditions += ` AND vt.vehicle_type = $${idx++}`;
      params.push(filters.vehicle_type);
    }

    if (filters.name) {
      conditions += ` AND d.name = $${idx++}`;
      params.push(filters.name);
    }

    if (filters.capacity) {
      conditions += ` AND v.capacity = $${idx++}`;
      params.push(filters.capacity);
    }

    if (filters.insurance_expiring_before) {
      conditions += ` AND v.insurance_expiry <= $${idx++}`;
      params.push(filters.insurance_expiring_before);
    }

    if (filters.maintenance_due_before) {
      conditions += ` AND v.maintenance_due_date <= $${idx++}`;
      params.push(filters.maintenance_due_before);
    }

    const baseQuery = `
    SELECT 
      v.vehicle_id,
      v.branch_id,
      b.branch_name,
      v.vehicle_no,
      v.vehicle_type_id,
      vt.vehicle_type,
      v.capacity,
      v.driver_id,
      d.name,
      v.maintenance_due_date,
      v.insurance_expiry
    FROM vehicles v
    LEFT JOIN branches b ON b.branch_id = v.branch_id
    LEFT JOIN drivers d ON d.driver_id = v.driver_id
    LEFT JOIN vehicle_types vt ON vt.vehicle_type_id = v.vehicle_type_id
    ${conditions}
    ORDER BY v.vehicle_id DESC
  `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Vehicles filtered successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;
    const paginatedQuery = baseQuery + ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const data = await this.dataSource.query(paginatedQuery, params);

    const countQuery = `
    SELECT COUNT(*)
    FROM vehicles v
    ${conditions}
  `;

    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Vehicles filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  /* ---------- ROUTE ---------- */
  async createRoute(dto: CreateRouteDto) {
    const vehicle = await this.dataSource.query(
      `SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1 AND status = 1`,
      [dto.vehicle_id],
    );

    if (vehicle.length === 0) {
      throw new BadRequestException('Vehicle not found');
    }

    // Check if vehicle is already assigned to another route
    const vehicleAssigned = await this.dataSource.query(
      `SELECT route_id, route_name FROM routes WHERE vehicle_id = $1 AND status = 1`,
      [dto.vehicle_id],
    );

    if (vehicleAssigned.length > 0) {
      throw new BadRequestException(
        `Vehicle is already assigned to ${vehicleAssigned[0].route_name}`,
      );
    }

    const exist = await this.dataSource.query(
      `
      SELECT route_id FROM routes 
      WHERE route_name = $1 AND branch_id = $2 AND status = 1
      `,
      [dto.route_name.trim(), dto.branch_id],
    );

    if (exist.length > 0) {
      throw new BadRequestException('Route already exists in this branch');
    }

    const now = new Date();

    await this.dataSource.query(
      `
      INSERT INTO routes
      (branch_id, route_name, start_point, end_point, vehicle_id, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 1, $6, $6)
      `,
      [
        dto.branch_id,
        dto.route_name.trim(),
        dto.start_point.trim(),
        dto.end_point.trim(),
        dto.vehicle_id,
        now,
      ],
    );

    return {
      status: true,
      message: 'Route created successfully',
    };
  }

  async updateRoute(route_id: number, dto: any) {
    if (!route_id) throw new BadRequestException('route_id is required');

    const check = await this.dataSource.query(
      `SELECT route_id FROM routes WHERE route_id = $1 AND status = 1`,
      [route_id],
    );

    if (check.length === 0) {
      throw new NotFoundException('Route not found');
    }

    // Check duplicate route name in same branch (excluding current)
    const exist = await this.dataSource.query(
      `
      SELECT route_id FROM routes 
      WHERE route_name = $1 AND branch_id = $2 AND route_id != $3 AND status = 1
      `,
      [dto.route_name.trim(), dto.branch_id, route_id],
    );

    if (exist.length > 0) {
      throw new BadRequestException('Route name already exists in this branch');
    }

    const vehicle = await this.dataSource.query(
      `SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1 AND status = 1`,
      [dto.vehicle_id],
    );

    if (vehicle.length === 0) {
      throw new BadRequestException('Vehicle not found');
    }

    // Check if vehicle is already assigned to another route (excluding current)
    const vehicleAssigned = await this.dataSource.query(
      `SELECT route_id, route_name FROM routes 
       WHERE vehicle_id = $1 AND route_id != $2 AND status = 1`,
      [dto.vehicle_id, route_id],
    );

    if (vehicleAssigned.length > 0) {
      throw new BadRequestException(
        `Vehicle is already assigned to route "${vehicleAssigned[0].route_name}"`,
      );
    }

    await this.dataSource.query(
      `
      UPDATE routes
      SET
        branch_id = $1,
        route_name = $2,
        start_point = $3,
        end_point = $4,
        vehicle_id = $5,
        updated_at = NOW()
      WHERE route_id = $6
      `,
      [
        dto.branch_id,
        dto.route_name.trim(),
        dto.start_point.trim(),
        dto.end_point.trim(),
        dto.vehicle_id,
        route_id,
      ],
    );

    return {
      status: true,
      message: 'Route updated successfully',
    };
  }

  async getRouteById(route_id: number) {
    if (!route_id) throw new BadRequestException('route_id is required');

    const query = `
      SELECT
        r.route_id,
        r.branch_id,
        r.route_name,
        r.start_point,
        r.end_point,
        r.vehicle_id
      FROM routes r
      LEFT JOIN branches b ON b.branch_id = r.branch_id
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
      WHERE r.route_id = $1 AND r.status = 1
    `;

    const result = await this.dataSource.query(query, [route_id]);

    if (result.length === 0) {
      throw new NotFoundException('Route not found');
    }

    return {
      status: true,
      message: 'Route fetched successfully',
      data: result[0],
    };
  }

  async getRouteByBranchId(branch_id: number) {
    if (!branch_id) throw new BadRequestException('route_id is required');

    const query = `
      SELECT
        r.route_id,
        r.branch_id,
        r.route_name,
        r.start_point,
        r.end_point,
        r.vehicle_id
      FROM routes r
      LEFT JOIN branches b ON b.branch_id = r.branch_id
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
      WHERE r.branch_id = $1 AND r.status = 1
    `;

    const result = await this.dataSource.query(query, [branch_id]);

    return {
      status: true,
      message:
        result.length > 0
          ? 'Route by branch fetched successfully'
          : 'No route found in this branch',
      data: result,
    };
  }

  async getAllRoutes(page?: number, limit?: number) {
    let baseQuery = `
      SELECT
        r.route_id,
        r.branch_id,
        b.branch_name,
        r.route_name,
        r.start_point,
        r.end_point,
        r.vehicle_id,
        v.vehicle_no
      FROM routes r
      LEFT JOIN branches b ON b.branch_id = r.branch_id
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
      WHERE r.status = 1
      ORDER BY r.route_id DESC
    `;

    const params: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(baseQuery, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM routes WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Routes fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async deleteRoute(route_id: number) {
    if (!route_id) {
      throw new BadRequestException('id is required');
    }
    const check = await this.dataSource.query(
      `SELECT route_id FROM routes WHERE route_id = $1 AND status = 1`,
      [route_id],
    );

    if (check.length === 0) {
      throw new BadRequestException('Route not found');
    }

    await this.dataSource.query(
      `
    UPDATE routes
    SET status = 0, updated_at = NOW()
    WHERE route_id = $1
    `,
      [route_id],
    );

    return {
      status: true,
      message: 'Route deleted successfully',
    };
  }

  async searchRoutes(keyword: string, page?: number, limit?: number) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];
    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
      SELECT
        r.route_id,
        r.branch_id,
        b.branch_name,
        r.route_name,
        r.start_point,
        r.end_point,
        r.vehicle_id,
        v.vehicle_no
      FROM routes r
      LEFT JOIN branches b ON b.branch_id = r.branch_id
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
      WHERE r.status = 1  
        AND (
          r.route_name ILIKE $1
          OR r.start_point ILIKE $1
          OR r.end_point ILIKE $1
          OR b.branch_name ILIKE $1
          OR v.vehicle_no ILIKE $1
        )
      ORDER BY r.route_id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM routes r
      LEFT JOIN branches b ON b.branch_id = r.branch_id
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
      WHERE r.status = 1
        AND (
          r.route_name ILIKE $1
          OR r.start_point ILIKE $1
          OR r.end_point ILIKE $1
          OR b.branch_name ILIKE $1
          OR v.vehicle_no ILIKE $1
        )
    `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Route search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterRoutes(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE r.status = 1`;
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name = $${idx++}`;
      params.push(filters.branch_name);
    }

    if (filters.route_name?.trim()) {
      conditions += ` AND r.route_name ILIKE $${idx++}`;
      params.push(`%${filters.route_name.trim()}%`);
    }

    if (filters.start_point?.trim()) {
      conditions += ` AND r.start_point ILIKE $${idx++}`;
      params.push(`%${filters.start_point.trim()}%`);
    }

    if (filters.end_point?.trim()) {
      conditions += ` AND r.end_point ILIKE $${idx++}`;
      params.push(`%${filters.end_point.trim()}%`);
    }

    if (filters.vehicle_no) {
      conditions += ` AND v.vehicle_no = $${idx++}`;
      params.push(filters.vehicle_no);
    }

    const baseQuery = `
      SELECT
        r.route_id,
        r.branch_id,
        b.branch_name,
        r.route_name,
        r.start_point,
        r.end_point,
        r.vehicle_id,
        v.vehicle_no
      FROM routes r
      LEFT JOIN branches b ON b.branch_id = r.branch_id
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
      ${conditions}
      ORDER BY r.route_id DESC
    `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Routes filtered successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;
    const paginatedQuery = baseQuery + ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const data = await this.dataSource.query(paginatedQuery, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM routes r
      LEFT JOIN branches b ON b.branch_id = r.branch_id
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
      ${conditions}
    `;

    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Routes filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  /* ---------- STUDENT TRANSPORT ---------- */

  async assignStudent(dto: AssignStudentTransportDto) {
    // Validate student exists and belongs to branch/class/section
    const student = await this.dataSource.query(
      `SELECT student_id 
     FROM students 
     WHERE student_id = $1 
       AND branch_id = $2 
       AND class_id = $3 
       AND section_id = $4 
       AND status = 1`,
      [dto.student_id, dto.branch_id, dto.class_id, dto.section_id],
    );

    if (student.length === 0) {
      throw new BadRequestException(
        'Student not found or does not belong to selected branch/class/section',
      );
    }

    const feeStructure = await this.dataSource.query(
      `SELECT * 
     FROM fee_structures 
     WHERE id = $1 
       AND branch_id = $2 
       AND status = 1`,
      [dto.fee_structure_id, dto.branch_id],
    );

    if (feeStructure.length === 0) {
      throw new BadRequestException(
        'Fee structure not found or does not belong to selected branch',
      );
    }

    console.log(feeStructure);

    const route = await this.dataSource.query(
      `SELECT r.route_id, r.route_name, r.vehicle_id, v.capacity, v.vehicle_no
     FROM routes r
     JOIN vehicles v ON v.vehicle_id = r.vehicle_id
     WHERE r.route_id = $1 AND r.branch_id = $2 AND r.status = 1`,
      [feeStructure[0].route_id, dto.branch_id],
    );

    if (route.length === 0) {
      throw new BadRequestException(
        'Route not found or does not belong to selected branch',
      );
    }

    console.log(route);

    const vehicleCapacity = route[0].capacity;
    const vehicleNo = route[0].vehicle_no;
    const routeName = route[0].route_name;


    console.log(vehicleCapacity, vehicleNo, routeName);

    // Check current number of students assigned to this route
    const assignedStudents = await this.dataSource.query(
      `SELECT COUNT(*) as count 
     FROM student_transport_assignment 
     WHERE fee_structure_id = $1 AND status = 1`,
      [dto.fee_structure_id],
    );

    const currentCount = Number(assignedStudents[0].count);

    if (currentCount >= vehicleCapacity) {
      throw new BadRequestException(
        `Cannot assign student. Route "${routeName}" has reached vehicle capacity (${vehicleCapacity}/${vehicleCapacity} students assigned to vehicle ${vehicleNo})`,
      );
    }

    // Check if student already assigned
    const exists = await this.dataSource.query(
      `SELECT id FROM student_transport_assignment 
     WHERE student_id = $1 AND status = 1`,
      [dto.student_id],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Student is already assigned');
    }

    await this.dataSource.query(
      `
    INSERT INTO student_transport_assignment
    (branch_id, class_id, section_id, student_id, fee_structure_id, pickup_location, drop_location)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        dto.branch_id,
        dto.class_id,
        dto.section_id,
        dto.student_id,
        dto.fee_structure_id,
        dto.pickup_location.trim(),
        dto.drop_location.trim(),
      ],
    );

    return {
      status: true,
      message: `Student transport assigned successfully`,
    };
  }

  async updateAssignment(id: number, dto: AssignStudentTransportDto) {
    if (!id) throw new BadRequestException('Assignment ID is required');

    // Check if assignment exists and is active
    const existingAssignment = await this.dataSource.query(
      `SELECT sta.student_id, sta.fee_structure_id 
     FROM student_transport_assignment sta 
     WHERE sta.id = $1 AND sta.status = 1`,
      [id],
    );

    if (existingAssignment.length === 0) {
      throw new NotFoundException('Assignment not found');
    }

    const oldStudentId = existingAssignment[0].student_id;
    const oldFeeStructureId = existingAssignment[0].fee_structure_id;

    // Validate student exists and belongs to the selected branch/class/section
    const student = await this.dataSource.query(
      `SELECT student_id 
     FROM students 
     WHERE student_id = $1 
       AND branch_id = $2 
       AND class_id = $3 
       AND section_id = $4 
       AND status = 1`,
      [dto.student_id, dto.branch_id, dto.class_id, dto.section_id],
    );

    if (student.length === 0) {
      throw new BadRequestException(
        'Student not found or does not belong to selected branch/class/section',
      );
    }

    // Validate fee structure exists and belongs to branch
    const feeStructure = await this.dataSource.query(
      `SELECT fs.*, r.route_id, r.route_name, v.capacity, v.vehicle_no
     FROM fee_structures fs
     INNER JOIN routes r ON r.route_id = fs.route_id AND r.status = 1
     LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id AND v.status = 1
     WHERE fs.id = $1 
       AND fs.branch_id = $2 
       AND fs.status = 1`,
      [dto.fee_structure_id, dto.branch_id],
    );

    if (feeStructure.length === 0) {
      throw new BadRequestException(
        'Fee structure not found or does not belong to selected branch',
      );
    }

    const newRouteName = feeStructure[0].route_name;
    const vehicleCapacity = feeStructure[0].capacity || 999; // fallback if no vehicle
    const vehicleNo = feeStructure[0].vehicle_no || 'N/A';

    // Check if student is already assigned to transport (except current assignment)
    if (dto.student_id !== oldStudentId) {
      const alreadyAssigned = await this.dataSource.query(
        `SELECT id FROM student_transport_assignment 
       WHERE student_id = $1 AND status = 1 AND id != $2`,
        [dto.student_id, id],
      );

      if (alreadyAssigned.length > 0) {
        throw new BadRequestException('Student is already assigned to transport');
      }
    }

    // Check vehicle capacity for the new fee_structure (route)
    // If fee_structure_id is changing OR staying the same, we still need to verify capacity
    const assignedCountQuery = await this.dataSource.query(
      `SELECT COUNT(*) as count 
     FROM student_transport_assignment 
     WHERE fee_structure_id = $1 AND status = 1
       AND id != $2`, // exclude current assignment being updated
      [dto.fee_structure_id, id],
    );

    const currentCountAfterUpdate = Number(assignedCountQuery[0].count) + 1; // +1 for this student

    if (currentCountAfterUpdate > vehicleCapacity) {
      throw new BadRequestException(
        `Cannot update assignment. Route "${newRouteName}" would exceed vehicle capacity ` +
        `(${currentCountAfterUpdate}/${vehicleCapacity} students for vehicle ${vehicleNo})`,
      );
    }

    // Perform the update
    await this.dataSource.query(
      `
    UPDATE student_transport_assignment
    SET branch_id = $1,
        class_id = $2,
        section_id = $3,
        student_id = $4,
        fee_structure_id = $5,
        pickup_location = $6,
        drop_location = $7,
        updated_at = NOW()
    WHERE id = $8
    `,
      [
        dto.branch_id,
        dto.class_id,
        dto.section_id,
        dto.student_id,
        dto.fee_structure_id,
        dto.pickup_location?.trim() || '',
        dto.drop_location?.trim() || '',
        id,
      ],
    );

    return {
      status: true,
      message: 'Student transport assignment updated successfully',
    };
  }

  async getAssignmentById(id: number) {
    if (!id) throw new BadRequestException('Assignment ID is required');

    const query = `
      SELECT
        sta.id,
        sta.branch_id,
        sta.class_id,
        sta.section_id,
        sta.student_id,
        sta.fee_structure_id,
        sta.pickup_location,
        sta.drop_location
      FROM student_transport_assignment sta
      INNER JOIN branches b ON b.branch_id = sta.branch_id AND b.status = 1
      INNER JOIN classes c ON c.class_id = sta.class_id AND c.status = 1
      INNER JOIN sections sec ON sec.section_id = sta.section_id
      INNER JOIN students s ON s.student_id = sta.student_id AND s.status = 1
      INNER JOIN fee_structures fs ON fs.id = sta.fee_structure_id AND fs.status = 1
      INNER JOIN routes r ON r.route_id = fs.route_id AND r.status = 1
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id AND v.status = 1
      WHERE sta.id = $1 AND sta.status = 1
    `;

    const result = await this.dataSource.query(query, [id]);

    if (result.length === 0) {
      throw new NotFoundException('Assignment not found');
    }

    const row = result[0];

    return {
      status: true,
      message: 'Assignment fetched successfully',
      data: {
        id: row.id,
        branch_id: row.branch_id,
        class_id: row.class_id,
        section_id: row.section_id,
        student_id: row.student_id,
        fee_structure_id: row.fee_structure_id,
        pickup_location: row.pickup_location,
        drop_location: row.drop_location,
      },
    };
  }

  async getAllAssignments(page?: number, limit?: number) {
    let baseQuery = `
      SELECT
        sta.id,
        b.branch_name,
        c.class_name,
        sec.section_name,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        r.route_name,
        v.vehicle_no,
        sta.pickup_location,
        sta.drop_location,
        fs.amount
      FROM student_transport_assignment sta
      INNER JOIN branches b ON b.branch_id = sta.branch_id AND b.status = 1
      INNER JOIN classes c ON c.class_id = sta.class_id AND c.status = 1
      INNER JOIN sections sec ON sec.section_id = sta.section_id
      INNER JOIN students s ON s.student_id = sta.student_id AND s.status = 1
      INNER JOIN fee_structures fs ON fs.id = sta.fee_structure_id AND fs.status = 1
      INNER JOIN routes r ON r.route_id = fs.route_id AND r.status = 1
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id AND v.status = 1
      WHERE sta.status = 1
      ORDER BY sta.id DESC
    `;

    const params: any[] = [];

    if (page && limit) {
      const currentPage = Math.max(1, page);
      const pageLimit = Math.max(1, limit);
      const offset = (currentPage - 1) * pageLimit;

      baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(pageLimit, offset);
    }

    const result = await this.dataSource.query(baseQuery, params);

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) AS count FROM student_transport_assignment WHERE status = 1`,
    );
    const totalRecords = Number(countResult[0].count);

    const data = result.map((row: any) => ({
      id: row.id,
      branch_id: row.branch_id,
      branch_name: row.branch_name,
      class_name: row.class_name,
      section_name: row.section_name,
      student_name: row.student_name.trim(),
      fee_structure_id: row.fee_structure_id,
      route_name: row.route_name,
      vehicle_no: row.vehicle_no || null,
      pickup_location: row.pickup_location,
      drop_location: row.drop_location,
      fee: row.amount,
    }));

    return {
      status: true,
      message: 'All transport assignments fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
      currentPage: page || 1,
    };
  }

  async deleteAssignment(id: number) {
    if (!id) throw new BadRequestException('Assignment ID is required');

    const exists = await this.dataSource.query(
      `SELECT id FROM student_transport_assignment WHERE id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Assignment not found');
    }

    await this.dataSource.query(
      `UPDATE student_transport_assignment SET status = 0, updated_at = NOW() WHERE id = $1`,
      [id],
    );

    return { status: true, message: 'Assignment deleted successfully' };
  }

  async searchAssignments(keyword: string, page?: number, limit?: number) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];

    let pagination = '';
    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
      SELECT
        sta.id,
        b.branch_name,
        c.class_name,
        sec.section_name,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        r.route_name,
        v.vehicle_no,
        sta.pickup_location,
        sta.drop_location,
        fs.amount AS fee
      FROM student_transport_assignment sta
      INNER JOIN branches b ON b.branch_id = sta.branch_id AND b.status = 1
      INNER JOIN classes c ON c.class_id = sta.class_id AND c.status = 1
      INNER JOIN sections sec ON sec.section_id = sta.section_id
      INNER JOIN students s ON s.student_id = sta.student_id AND s.status = 1
      INNER JOIN fee_structures fs ON fs.id = sta.fee_structure_id AND fs.status = 1
      INNER JOIN routes r ON r.route_id = fs.route_id AND r.status = 1
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id AND v.status = 1
      WHERE sta.status = 1
        AND (
          CONCAT(s.first_name, ' ', s.last_name) ILIKE $1
          OR b.branch_name ILIKE $1
          OR c.class_name ILIKE $1
          OR sec.section_name ILIKE $1
          OR r.route_name ILIKE $1
          OR v.vehicle_no ILIKE $1
          OR sta.pickup_location ILIKE $1
          OR sta.drop_location ILIKE $1
        )
      ORDER BY sta.id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
      SELECT COUNT(*) AS count
      FROM student_transport_assignment sta
      INNER JOIN branches b ON b.branch_id = sta.branch_id AND b.status = 1
      INNER JOIN classes c ON c.class_id = sta.class_id AND c.status = 1
      INNER JOIN sections sec ON sec.section_id = sta.section_id
      INNER JOIN students s ON s.student_id = sta.student_id AND s.status = 1
      INNER JOIN fee_structures fs ON fs.id = sta.fee_structure_id AND fs.status = 1
      INNER JOIN routes r ON r.route_id = fs.route_id AND r.status = 1
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id AND v.status = 1
      WHERE sta.status = 1
        AND (
          CONCAT(s.first_name, ' ', s.last_name) ILIKE $1
          OR b.branch_name ILIKE $1
          OR c.class_name ILIKE $1
          OR sec.section_name ILIKE $1
          OR r.route_name ILIKE $1
          OR v.vehicle_no ILIKE $1
          OR sta.pickup_location ILIKE $1
          OR sta.drop_location ILIKE $1
        )
    `;

    const countResult = await this.dataSource.query(countQuery, [search]);
    const totalRecords = Number(countResult[0].count);

    const mappedData = data.map((row: any) => ({
      id: row.id,
      branch_name: row.branch_name,
      class_name: row.class_name,
      section_name: row.section_name,
      student_name: row.student_name.trim(),
      route_name: row.route_name,
      vehicle_no: row.vehicle_no || null,
      pickup_location: row.pickup_location,
      drop_location: row.drop_location,
      fee: row.fee,
    }));

    return {
      status: true,
      message: 'Assignment search results fetched successfully',
      data: mappedData,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
      currentPage: page || 1,
    };
  }

  async filterAssignments(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE sta.status = 1`;
    let paramIndex = 1;

    if (filters.branch_name?.trim()) {
      conditions += ` AND b.branch_name ILIKE $${paramIndex++}`;
      params.push(`%${filters.branch_name.trim()}%`);
    }
    if (filters.class_name?.trim()) {
      conditions += ` AND c.class_name ILIKE $${paramIndex++}`;
      params.push(`%${filters.class_name.trim()}%`);
    }
    if (filters.section_name?.trim()) {
      conditions += ` AND sec.section_name ILIKE $${paramIndex++}`;
      params.push(`%${filters.section_name.trim()}%`);
    }
    if (filters.student_name?.trim()) {
      conditions += ` AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $${paramIndex++}`;
      params.push(`%${filters.student_name.trim()}%`);
    }
    if (filters.route_name?.trim()) {
      conditions += ` AND r.route_name ILIKE $${paramIndex++}`;
      params.push(`%${filters.route_name.trim()}%`);
    }
    if (filters.vehicle_no?.trim()) {
      conditions += ` AND v.vehicle_no ILIKE $${paramIndex++}`;
      params.push(`%${filters.vehicle_no.trim()}%`);
    }

    // if (filters.pickup_location?.trim()) {
    //   conditions += ` AND sta.pickup_location ILIKE $${paramIndex++}`;
    //   params.push(`%${filters.pickup_location.trim()}%`);
    // }
    // if (filters.drop_location?.trim()) {
    //   conditions += ` AND sta.drop_location ILIKE $${paramIndex++}`;
    //   params.push(`%${filters.drop_location.trim()}%`);
    // }

    const baseQuery = `
      SELECT
        sta.id,
        b.branch_name,
        c.class_name,
        sec.section_name,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        r.route_name,
        v.vehicle_no,
        sta.pickup_location,
        sta.drop_location,
        fs.amount AS fee
      FROM student_transport_assignment sta
      INNER JOIN branches b ON b.branch_id = sta.branch_id AND b.status = 1
      INNER JOIN classes c ON c.class_id = sta.class_id AND c.status = 1
      INNER JOIN sections sec ON sec.section_id = sta.section_id
      INNER JOIN students s ON s.student_id = sta.student_id AND s.status = 1
      INNER JOIN fee_structures fs ON fs.id = sta.fee_structure_id AND fs.status = 1
      INNER JOIN routes r ON r.route_id = fs.route_id AND r.status = 1
      LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id AND v.status = 1
      ${conditions}
      ORDER BY sta.id DESC
    `;

    let data;
    let totalRecords;

    if (page && limit) {
      const offset = (page - 1) * limit;
      const paginatedQuery = `${baseQuery} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
      data = await this.dataSource.query(paginatedQuery, params);

      // Count query (without LIMIT/OFFSET)
      const countQuery = `
        SELECT COUNT(*) AS count
        FROM student_transport_assignment sta
        INNER JOIN branches b ON b.branch_id = sta.branch_id AND b.status = 1
        INNER JOIN classes c ON c.class_id = sta.class_id AND c.status = 1
        INNER JOIN sections sec ON sec.section_id = sta.section_id
        INNER JOIN students s ON s.student_id = sta.student_id AND s.status = 1
        INNER JOIN fee_structures fs ON fs.id = sta.fee_structure_id AND fs.status = 1
        INNER JOIN routes r ON r.route_id = fs.route_id AND r.status = 1
        LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id AND v.status = 1
        ${conditions}
      `;
      const countParams = params.slice(0, -2); // exclude limit & offset
      const countResult = await this.dataSource.query(countQuery, countParams);
      totalRecords = Number(countResult[0].count);
    } else {
      data = await this.dataSource.query(baseQuery, params);
      totalRecords = data.length;
    }

    const mappedData = data.map((row: any) => ({
      id: row.id,
      branch_name: row.branch_name,
      class_name: row.class_name,
      section_name: row.section_name,
      student_name: row.student_name.trim(),
      route_name: row.route_name,
      vehicle_no: row.vehicle_no || null,
      pickup_location: row.pickup_location,
      drop_location: row.drop_location,
      fee: row.fee,
    }));

    return {
      status: true,
      message: 'Assignments filtered successfully',
      data: mappedData,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
      currentPage: page || 1,
    };
  }
}

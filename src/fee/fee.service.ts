import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateFeeStructureDto } from './create-fee_structure.dto';
import { FeeTypeId } from './create-fee_structure.dto';
import { CreateFeePaymentDto } from './create-fee_payment.dto';

@Injectable()
export class FeeService {
  constructor(private dataSource: DataSource) { }
  async createFeeStructure(dto: CreateFeeStructureDto) {
    let uniquenessQuery: string;
    let uniquenessParams: any[];

    if (dto.fee_type_id === FeeTypeId.TUITION) {
      // Tuition: class_id is required
      if (!dto.class_id) {
        throw new BadRequestException('Class is required for Tuition fee');
      }

      // Check uniqueness: same branch + class + fee_type
      uniquenessQuery = `
      SELECT id FROM fee_structures 
      WHERE branch_id = $1 
        AND class_id = $2 
        AND fee_type_id = $3 
        AND status = 1
    `;
      uniquenessParams = [dto.branch_id, dto.class_id, dto.fee_type_id];
    } else if (dto.fee_type_id === FeeTypeId.TRANSPORT) {
      // Transport: route_id is required, validate route exists
      if (!dto.route_id) {
        throw new BadRequestException('Route is required for Transport fee');
      }

      // Validate route exists
      const route = await this.dataSource.query(
        `SELECT route_id FROM routes WHERE route_id = $1 AND status = 1`,
        [dto.route_id],
      );

      if (route.length === 0) {
        throw new BadRequestException('Route not found');
      }

      // Check uniqueness: same branch + route_id
      uniquenessQuery = `
      SELECT id FROM fee_structures 
      WHERE branch_id = $1 
        AND fee_type_id = $2 
        AND route_id = $3
        AND status = 1
      `;
      uniquenessParams = [
        dto.branch_id,
        dto.fee_type_id,
        dto.route_id,
      ];
    } else {
      // Other fees: class_id can be null → check only branch + fee_type
      uniquenessQuery = `
      SELECT id FROM fee_structures 
      WHERE branch_id = $1 
        AND (class_id IS NULL OR class_id = $2)
        AND fee_type_id = $3 
        AND status = 1
    `;
      uniquenessParams = [
        dto.branch_id,
        dto.class_id || null,
        dto.fee_type_id,
      ];
    }

    const exist = await this.dataSource.query(
      uniquenessQuery,
      uniquenessParams,
    );

    if (exist.length > 0) {
      throw new BadRequestException(
        'This fee type already exists for the selected branch' +
        (dto.fee_type_id === FeeTypeId.TUITION
          ? ' and class'
          : dto.fee_type_id === FeeTypeId.TRANSPORT
            ? ' with this route'
            : ''),
      );
    }

    const now = new Date();

    await this.dataSource.query(
      `
    INSERT INTO fee_structures
    (branch_id, class_id, fee_type_id, route_id, amount, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, 1, $6, $6)
    `,
      [
        dto.branch_id,
        dto.class_id || null,
        dto.fee_type_id,
        dto.route_id || null,
        dto.amount,
        now,
      ],
    );

    return {
      status: true,
      message: 'Fee structure created successfully',
    };
  }

  async updateFeeStructure(id: number, dto: CreateFeeStructureDto) {
    // First check if record exists
    const exists = await this.dataSource.query(
      `SELECT id FROM fee_structures WHERE id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Fee structure not found');
    }

    let uniquenessQuery: string;
    let uniquenessParams: any[];

    if (dto.fee_type_id === FeeTypeId.TUITION) {
      if (!dto.class_id) {
        throw new BadRequestException('Class is required for Tuition fee');
      }

      uniquenessQuery = `
      SELECT id FROM fee_structures 
      WHERE branch_id = $1 
        AND class_id = $2 
        AND fee_type_id = $3 
        AND id != $4 
        AND status = 1
    `;
      uniquenessParams = [dto.branch_id, dto.class_id, dto.fee_type_id, id];
    } else if (dto.fee_type_id === FeeTypeId.TRANSPORT) {
      if (!dto.route_id) {
        throw new BadRequestException('Route is required for Transport fee');
      }

      // Validate route exists
      const route = await this.dataSource.query(
        `SELECT route_id FROM routes WHERE route_id = $1 AND status = 1`,
        [dto.route_id],
      );

      if (route.length === 0) {
        throw new BadRequestException('Route not found');
      }

      uniquenessQuery = `
      SELECT id FROM fee_structures 
      WHERE branch_id = $1 
        AND fee_type_id = $2 
        AND route_id = $3
        AND id != $4 
        AND status = 1
      `;
      uniquenessParams = [
        dto.branch_id,
        dto.fee_type_id,
        dto.route_id,
        id,
      ];
    } else {
      uniquenessQuery = `
      SELECT id FROM fee_structures 
      WHERE branch_id = $1 
        AND (class_id IS NULL OR class_id = $2)
        AND fee_type_id = $3 
        AND id != $4 
        AND status = 1
    `;
      uniquenessParams = [
        dto.branch_id,
        dto.class_id || null,
        dto.fee_type_id,
        id,
      ];
    }

    const duplicate = await this.dataSource.query(
      uniquenessQuery,
      uniquenessParams,
    );

    if (duplicate.length > 0) {
      throw new BadRequestException(
        'This fee type already exists for the selected branch' +
        (dto.fee_type_id === FeeTypeId.TUITION
          ? ' and class'
          : dto.fee_type_id === FeeTypeId.TRANSPORT
            ? ' with this route'
            : ''),
      );
    }

    await this.dataSource.query(
      `
    UPDATE fee_structures
    SET branch_id = $1,
        class_id = $2,
        fee_type_id = $3,
        route_id = $4,
        amount = $5,
        updated_at = NOW()
    WHERE id = $6
    `,
      [
        dto.branch_id,
        dto.class_id || null,
        dto.fee_type_id,
        dto.route_id || null,
        dto.amount,
        id,
      ],
    );

    return {
      status: true,
      message: 'Fee structure updated successfully',
    };
  }

  async getFeeStructureById(id: number) {
    if (!id) {
      throw new BadRequestException('Fee structure ID is required');
    }

    const query = `
    SELECT
      fs.id,
      fs.branch_id,
      b.branch_name,
      fs.class_id,
      c.class_name,
      fs.fee_type_id,
      ft.name AS fee_type,
      fs.route_id,
      r.route_name,
      r.start_point,
      r.end_point,
      fs.amount
    FROM fee_structures fs
    LEFT JOIN branches b ON b.branch_id = fs.branch_id
    LEFT JOIN classes c ON c.class_id = fs.class_id
    LEFT JOIN fees_types ft ON ft.id = fs.fee_type_id
    LEFT JOIN routes r ON r.route_id = fs.route_id
    WHERE fs.id = $1 AND fs.status = 1
  `;

    const result = await this.dataSource.query(query, [id]);

    if (result.length === 0) {
      throw new NotFoundException('Fee structure not found');
    }

    return {
      status: true,
      message: 'Fee structure fetched successfully',
      data: result[0],
    };
  }

  async getFeeStructureByBranchId(branchId: number) {
    if (!branchId) {
      throw new BadRequestException('Branch ID is required');
    }

    const query = `
    SELECT
      fs.id,
      fs.branch_id,
      b.branch_name,
      fs.class_id,
      c.class_name,
      fs.fee_type_id,
      ft.name AS fee_type_name,
      fs.route_id,
      r.route_name,
      r.start_point,
      r.end_point,
      fs.amount
    FROM fee_structures fs
    LEFT JOIN branches b ON b.branch_id = fs.branch_id
    LEFT JOIN classes c ON c.class_id = fs.class_id
    LEFT JOIN fees_types ft ON ft.id = fs.fee_type_id
    LEFT JOIN routes r ON r.route_id = fs.route_id
    WHERE fs.branch_id = $1 
      AND fs.status = 1
    ORDER BY 
      fs.fee_type_id ASC,
      c.class_name ASC NULLS LAST  -- Tuition (with class) first, then others
  `;

    const result = await this.dataSource.query(query, [branchId]);

    return {
      status: true,
      message:
        result.length > 0
          ? 'Fee structures fetched successfully'
          : 'No fee found in this branch',
      data: result,
    };
  }

  async getTransportFeeStructureByBranch(branchId: number) {
    if (!branchId) {
      throw new BadRequestException('Branch ID is required');
    }

    let query = `
     SELECT
      fs.id,
      b.branch_name,
      ft.name AS fee_type_name,
      r.route_name,
      r.start_point,
      r.end_point,
      fs.amount
    FROM fee_structures fs
    LEFT JOIN branches b ON b.branch_id = fs.branch_id
    LEFT JOIN fees_types ft ON ft.id = fs.fee_type_id
    LEFT JOIN routes r ON r.route_id = fs.route_id
    WHERE fs.branch_id = $1 AND fs.status = 1 AND ft.name = 'Transport'
    ORDER BY fs.id DESC
    `;

    const result = await this.dataSource.query(query, [branchId]);

    return {
      status: true,
      message:
        result.length > 0
          ? 'Transport fee structures fetched successfully'
          : 'No transport fee found in this branch',
      data: result,
    };
  }

  async getAllFeeStructures(page?: number, limit?: number) {
    let baseQuery = `
    SELECT
      fs.id,
      fs.branch_id,
      b.branch_name,
      fs.class_id,
      c.class_name,
      fs.fee_type_id,
      ft.name AS fee_type,
      fs.route_id,
      r.route_name,
      r.start_point,
      r.end_point,
      fs.amount
    FROM fee_structures fs
    LEFT JOIN branches b ON b.branch_id = fs.branch_id
    LEFT JOIN classes c ON c.class_id = fs.class_id
    LEFT JOIN fees_types ft ON ft.id = fs.fee_type_id
    LEFT JOIN routes r ON r.route_id = fs.route_id
    WHERE fs.status = 1
    ORDER BY fs.id DESC
  `;

    const params: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(baseQuery, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM fee_structures WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Fee structures fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async deleteFeeStructure(id: number) {
    if (!id) {
      throw new BadRequestException('Fee structure ID is required');
    }

    const exists = await this.dataSource.query(
      `SELECT id FROM fee_structures WHERE id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Fee structure not found');
    }

    await this.dataSource.query(
      `UPDATE fee_structures SET status = 0, updated_at = NOW() WHERE id = $1`,
      [id],
    );

    return {
      status: true,
      message: 'Fee structure deleted successfully',
    };
  }

  async searchFeeStructures(keyword: string, page?: number, limit?: number) {
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
      fs.id,
      b.branch_name,
      c.class_name,
      ft.name AS fee_type,
      fs.route_id,
      r.route_name,
      r.start_point,
      r.end_point,
      fs.amount
    FROM fee_structures fs
    LEFT JOIN branches b ON b.branch_id = fs.branch_id
    LEFT JOIN classes c ON c.class_id = fs.class_id
    LEFT JOIN fees_types ft ON ft.id = fs.fee_type_id
    LEFT JOIN routes r ON r.route_id = fs.route_id
    WHERE fs.status = 1
      AND (
        b.branch_name ILIKE $1
        OR c.class_name ILIKE $1
        OR ft.name ILIKE $1
        OR r.route_name ILIKE $1
        OR CAST(fs.amount AS TEXT) ILIKE $1
      )
    ORDER BY fs.id DESC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
    SELECT COUNT(*)
    FROM fee_structures fs
    LEFT JOIN branches b ON b.branch_id = fs.branch_id
    LEFT JOIN classes c ON c.class_id = fs.class_id
    LEFT JOIN fees_types ft ON ft.id = fs.fee_type_id
    LEFT JOIN routes r ON r.route_id = fs.route_id
    WHERE fs.status = 1
      AND (
        b.branch_name ILIKE $1
        OR c.class_name ILIKE $1
        OR ft.name ILIKE $1
        OR r.route_name ILIKE $1
        OR CAST(fs.amount AS TEXT) ILIKE $1
      )
  `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Fee structures search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterFeeStructures(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE fs.status = 1`;
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name = $${idx++}`;
      params.push(filters.branch_name);
    }

    if (filters.class_name) {
      conditions += ` AND c.class_name = $${idx++}`;
      params.push(filters.class_name);
    }

    if (filters.name) {
      conditions += ` AND ft.name = $${idx++}`;
      params.push(filters.name);
    }

    if (filters.min_amount !== undefined) {
      conditions += ` AND fs.amount >= $${idx++}`;
      params.push(filters.min_amount);
    }

    if (filters.max_amount !== undefined) {
      conditions += ` AND fs.amount <= $${idx++}`;
      params.push(filters.max_amount);
    }

    const baseQuery = `
    SELECT
      fs.id,
      fs.branch_id,
      b.branch_name,
      fs.class_id,
      c.class_name,
      fs.fee_type_id,
      ft.name AS fee_type,
      fs.route_id,
      r.route_name,
      r.start_point,
      r.end_point,
      fs.amount
    FROM fee_structures fs
    LEFT JOIN branches b ON b.branch_id = fs.branch_id
    LEFT JOIN classes c ON c.class_id = fs.class_id
    LEFT JOIN fees_types ft ON ft.id = fs.fee_type_id
    LEFT JOIN routes r ON r.route_id = fs.route_id
    ${conditions}
    ORDER BY fs.id DESC
  `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Fee structures filtered successfully',
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
    FROM fee_structures fs
    LEFT JOIN branches b ON b.branch_id = fs.branch_id
    LEFT JOIN classes c ON c.class_id = fs.class_id
    LEFT JOIN fees_types ft ON ft.id = fs.fee_type_id
    ${conditions}
  `;

    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Fee structures filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  // ---------- FEE PAYMENT----------
  async createPayment(dto: CreateFeePaymentDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Insert main payment record
      const paymentInsert = await queryRunner.query(
        `
      INSERT INTO fee_payments 
      (branch_id, class_id, section_id, student_id, payment_date, payment_mode_id, total_amount_paid, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), NOW())
      RETURNING id
      `,
        [
          dto.branch_id,
          dto.class_id,
          dto.section_id,
          dto.student_id,
          dto.payment_date,
          dto.payment_mode,
          dto.total_amount_paid,
        ],
      );

      const paymentId = paymentInsert[0].id;

      // 2. Insert each fee detail
      for (const detail of dto.details) {
        // Optional: Validate fee_structure belongs to branch/class if tuition
        const structure = await queryRunner.query(
          `SELECT id, fee_type_id FROM fee_structures WHERE id = $1 AND status = 1`,
          [detail.fee_structure_id],
        );

        if (structure.length === 0) {
          throw new BadRequestException(
            `Invalid fee structure ID: ${detail.fee_structure_id}`,
          );
        }

        await queryRunner.query(
          `
        INSERT INTO fee_payment_details 
        (fee_payment_id, fee_structure_id, amount_paid, status, created_at, updated_at)
        VALUES ($1, $2, $3, 1, NOW(), NOW())
        `,
          [paymentId, detail.fee_structure_id, detail.amount_paid],
        );
      }

      await queryRunner.commitTransaction();

      return {
        status: true,
        message: 'Payment recorded successfully',
        // data: { payment_id: paymentId },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message || 'Payment failed');
    } finally {
      await queryRunner.release();
    }
  }

  async getPayments(page?: number, limit?: number) {
    let baseQuery = `
    SELECT
      fp.id,
      fp.branch_id,
      b.branch_name,
      fp.class_id,
      c.class_name,
      fp.section_id,
      sec.section_name,
      fp.student_id,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      fp.payment_date,
      fp.payment_mode_id,
      pm.payment_mode,
      fp.total_amount_paid
    FROM fee_payments fp
    LEFT JOIN branches b ON b.branch_id = fp.branch_id
    LEFT JOIN classes c ON c.class_id = fp.class_id
    LEFT JOIN sections sec ON sec.section_id = fp.section_id
    LEFT JOIN students s ON s.student_id = fp.student_id
    LEFT JOIN payments_modes pm ON pm.payment_mode_id = fp.payment_mode_id
    WHERE fp.status = 1
    ORDER BY fp.id DESC
  `;

    const params: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(baseQuery, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM fee_payments WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Payments fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async getPaymentById(id: number) {
    if (!id) {
      throw new BadRequestException('Payment ID is required');
    }

    const mainQuery = `
    SELECT
      fp.id,
      fp.branch_id,
      b.branch_name,
      fp.class_id,
      c.class_name,
      fp.section_id,
      sec.section_name,
      fp.student_id,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      fp.payment_date,
      fp.payment_mode_id,
      pm.payment_mode,
      fp.total_amount_paid
    FROM fee_payments fp
    LEFT JOIN branches b ON b.branch_id = fp.branch_id
    LEFT JOIN classes c ON c.class_id = fp.class_id
    LEFT JOIN sections sec ON sec.section_id = fp.section_id
    LEFT JOIN students s ON s.student_id = fp.student_id
    LEFT JOIN payments_modes pm ON pm.payment_mode_id = fp.payment_mode_id
    WHERE fp.id = $1 AND fp.status = 1
  `;

    const mainResult = await this.dataSource.query(mainQuery, [id]);

    if (mainResult.length === 0) {
      throw new NotFoundException('Payment not found');
    }

    const detailsQuery = `
    SELECT
      fpd.id,
      fpd.fee_structure_id,
      ft.name AS fee_type_name,
      fpd.amount_paid,
      fs.start_point,
      fs.end_point
    FROM fee_payment_details fpd
    LEFT JOIN fee_structures fs ON fs.id = fpd.fee_structure_id
    LEFT JOIN fees_types ft ON ft.id = fs.fee_type_id
    WHERE fpd.fee_payment_id = $1 AND fpd.status = 1
  `;

    const details = await this.dataSource.query(detailsQuery, [id]);

    return {
      status: true,
      message: 'Payment fetched successfully',
      data: {
        ...mainResult[0],
        details,
      },
    };
  }

  async updatePayment(id: number, dto: CreateFeePaymentDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update main payment
      await queryRunner.query(
        `
      UPDATE fee_payments
      SET branch_id = $1,
          class_id = $2,
          section_id = $3,
          student_id = $4,
          payment_date = $5,
          payment_mode_id = $6,
          total_amount_paid = $7,
          updated_at = NOW()
      WHERE id = $8 AND status = 1
      `,
        [
          dto.branch_id,
          dto.class_id,
          dto.section_id,
          dto.student_id,
          dto.payment_date,
          dto.payment_mode,
          dto.total_amount_paid,
          id,
        ],
      );

      // 2. Identify fee_structure_ids in the incoming DTO
      const incomingFeeStructureIds = dto.details.map(
        (d) => d.fee_structure_id,
      );

      // 3. Soft delete details that are NOT in the incoming DTO
      if (incomingFeeStructureIds.length > 0) {
        await queryRunner.query(
          `
        UPDATE fee_payment_details 
        SET status = 0, updated_at = NOW() 
        WHERE fee_payment_id = $1 
          AND fee_structure_id NOT IN (${incomingFeeStructureIds.join(',')})
          AND status = 1
        `,
          [id],
        );
      } else {
        // If no details provided, delete all
        await queryRunner.query(
          `UPDATE fee_payment_details SET status = 0, updated_at = NOW() WHERE fee_payment_id = $1`,
          [id],
        );
      }

      // 4. Update existing details or insert new ones
      for (const detail of dto.details) {
        // Check if detail exists (even if status=0, we might want to reactivate it, but simplify to update if status=1)
        const existingDetail = await queryRunner.query(
          `SELECT id FROM fee_payment_details 
           WHERE fee_payment_id = $1 AND fee_structure_id = $2`,
          [id, detail.fee_structure_id],
        );

        if (existingDetail.length > 0) {
          // Update existing record
          await queryRunner.query(
            `
            UPDATE fee_payment_details
            SET amount_paid = $1, status = 1, updated_at = NOW()
            WHERE id = $2
            `,
            [detail.amount_paid, existingDetail[0].id],
          );
        } else {
          // Insert new record
          await queryRunner.query(
            `
            INSERT INTO fee_payment_details 
            (fee_payment_id, fee_structure_id, amount_paid, status, created_at, updated_at)
            VALUES ($1, $2, $3, 1, NOW(), NOW())
            `,
            [id, detail.fee_structure_id, detail.amount_paid],
          );
        }
      }

      await queryRunner.commitTransaction();

      return {
        status: true,
        message: 'Payment updated successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      throw new BadRequestException('Update failed');
    } finally {
      await queryRunner.release();
    }
  }

  async deletePayment(id: number) {
    if (!id) {
      throw new BadRequestException('Payment ID is required');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Soft delete details first
      await queryRunner.query(
        `UPDATE fee_payment_details SET status = 0, updated_at = NOW() WHERE fee_payment_id = $1`,
        [id],
      );

      // Then delete main payment
      await queryRunner.query(
        `UPDATE fee_payments SET status = 0, updated_at = NOW() WHERE id = $1`,
        [id],
      );

      await queryRunner.commitTransaction();

      return {
        status: true,
        message: 'Payment deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Delete failed');
    } finally {
      await queryRunner.release();
    }
  }

  async searchFeePayments(keyword: string, page?: number, limit?: number) {
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
      fp.id,
      fp.branch_id,
      b.branch_name,
      fp.class_id,
      c.class_name,
      fp.section_id,
      sec.section_name,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      fp.payment_date,
      pm.payment_mode,
      fp.total_amount_paid
    FROM fee_payments fp
    LEFT JOIN branches b ON b.branch_id = fp.branch_id
    LEFT JOIN classes c ON c.class_id = fp.class_id
    LEFT JOIN sections sec ON sec.section_id = fp.section_id
    LEFT JOIN students s ON s.student_id = fp.student_id
    LEFT JOIN payments_modes pm ON pm.payment_mode_id = fp.payment_mode_id
    WHERE fp.status = 1
      AND (
        b.branch_name ILIKE $1
        OR c.class_name ILIKE $1
        OR sec.section_name ILIKE $1
        OR s.first_name ILIKE $1
        OR s.last_name ILIKE $1
        OR pm.payment_mode ILIKE $1
      )
    ORDER BY fp.id DESC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
    SELECT COUNT(*)
    FROM fee_payments fp
    WHERE fp.status = 1
      AND EXISTS (
        SELECT 1 FROM branches b WHERE b.branch_id = fp.branch_id AND b.branch_name ILIKE $1
        UNION
        SELECT 1 FROM classes c WHERE c.class_id = fp.class_id AND c.class_name ILIKE $1
        UNION
        SELECT 1 FROM sections sec WHERE sec.section_id = fp.section_id AND sec.section_name ILIKE $1
        UNION
        SELECT 1 FROM students s WHERE s.student_id = fp.student_id AND (s.first_name ILIKE $1 OR s.last_name ILIKE $1)
      )
  `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Payments search results',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterFeePayments(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE fp.status = 1`;
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name = $${idx++}`;
      params.push(filters.branch_name);
    }

    if (filters.class_name) {
      conditions += ` AND c.class_name = $${idx++}`;
      params.push(filters.class_name);
    }

    if (filters.section_name) {
      conditions += ` AND sec.section_name = $${idx++}`;
      params.push(filters.section_name);
    }

    if (filters.student_name) {
      conditions += ` AND CONCAT(s.fisrt_name, ' ',s.last_name) = $${idx++}`;
      params.push(filters.student_name);
    }

    if (filters.payment_mode) {
      conditions += ` AND pm.payment_mode = $${idx++}`;
      params.push(filters.payment_mode);
    }

    // if (filters.min_amount !== undefined) {
    //   conditions += ` AND fp.total_amount_paid >= $${idx++}`;
    //   params.push(filters.min_amount);
    // }

    // if (filters.max_amount !== undefined) {
    //   conditions += ` AND fp.total_amount_paid <= $${idx++}`;
    //   params.push(filters.max_amount);
    // }

    // if (filters.payment_date_from) {
    //   conditions += ` AND fp.payment_date >= $${idx++}`;
    //   params.push(filters.payment_date_from);
    // }

    // if (filters.payment_date_to) {
    //   conditions += ` AND fp.payment_date <= $${idx++}`;
    //   params.push(filters.payment_date_to);
    // }

    const baseQuery = `
    SELECT
      fp.id,
      fp.branch_id,
      b.branch_name,
      fp.class_id,
      c.class_name,
      fp.section_id,
      sec.section_name,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      fp.payment_date,
      pm.payment_mode,
      fp.total_amount_paid
    FROM fee_payments fp
    LEFT JOIN branches b ON b.branch_id = fp.branch_id
    LEFT JOIN classes c ON c.class_id = fp.class_id
    LEFT JOIN sections sec ON sec.section_id = fp.section_id
    LEFT JOIN students s ON s.student_id = fp.student_id
    LEFT JOIN payments_modes pm ON pm.payment_mode_id = fp.payment_mode_id
    ${conditions}
    ORDER BY fp.id DESC
  `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Filtered payments',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;
    const paginatedQuery = baseQuery + ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const data = await this.dataSource.query(paginatedQuery, params);

    const countQuery = `SELECT COUNT(*) 
    FROM fee_payments fp 
    LEFT JOIN branches b ON b.branch_id = fp.branch_id
    LEFT JOIN classes c ON c.class_id = fp.class_id
    LEFT JOIN sections sec ON sec.section_id = fp.section_id
    LEFT JOIN students s ON s.student_id = fp.student_id
    LEFT JOIN payments_modes pm ON pm.payment_mode_id = fp.payment_mode_id
    ${conditions}`;
    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Filtered payments',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }
}

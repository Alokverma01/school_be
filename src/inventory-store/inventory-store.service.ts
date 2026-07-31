import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class InventoryService {
  constructor(readonly dataSource: DataSource) { }

  // CREATE
  async createItem(body: any) {

    const exists = await this.dataSource.query(
      `SELECT item_id FROM inventory WHERE item_id = $1 AND status = 1`,
      [body.item_id],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Inventory item already exists');
    }

    await this.dataSource.query(
      `INSERT INTO inventory 
       (branch_id, item_name, category_id, quantity, unit_cost, vendor)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        body.branch_id,
        body.item_name,
        body.category_id,
        body.quantity,
        body.unit_cost,
        body.vendor,
      ],
    );

    return {
      status: true,
      message: 'Inventory item created successfully',
    };
  }

  // UPDATE
  async updateItem(item_id: number, body: any) {
    if (!item_id) {
      throw new BadRequestException('item_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT item_id FROM inventory WHERE item_id = $1 AND status = 1`,
      [item_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Inventory item not found');
    }

    await this.dataSource.query(
      `
      UPDATE inventory
      SET
        branch_id   = $1,
        item_name   = $2,
        category_id    = $3,
        quantity    = $4,
        unit_cost   = $5,
        vendor      = $6,
        updated_at  = NOW()
      WHERE item_id = $7
      `,
      [
        body.branch_id,
        body.item_name,
        body.category_id,
        body.quantity,
        body.unit_cost,
        body.vendor,
        item_id,
      ],
    );

    return {
      status: true,
      message: 'Inventory item updated successfully',
    };
  }

  // GET ALL WITH PAGINATION
  async getAllItems(page?: number, limit?: number) {
    let query = `
      SELECT 
        i.item_id, 
        i.branch_id,
        b.branch_name,
        i.item_name, 
        i.category_id, 
        pc.category_name,
        i.quantity, 
        i.unit_cost, 
        i.vendor
      FROM inventory i
      LEFT JOIN branches b ON i.branch_id = b.branch_id
      LEFT JOIN product_categories pc ON i.category_id = pc.category_id
      WHERE i.status = 1
      ORDER BY i.item_id ASC
    `;

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const items = await this.dataSource.query(query);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM inventory WHERE status = 1`,
    );

    const totalRecords = parseInt(totalResult[0].count);

    return {
      status: true,
      message: 'Inventory fetched successfully',
      data: items,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // GET BY ID
  async getItemById(item_id: number) {
    if (!item_id) {
      throw new BadRequestException('item_id is required');
    }

    const result = await this.dataSource.query(
      `SELECT 
        i.item_id, 
        i.branch_id,
        i.item_name, 
        i.category_id, 
        i.quantity, 
        i.unit_cost, 
        i.vendor
       FROM inventory i
       WHERE i.item_id = $1 AND i.status = 1`,
      [item_id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Item not found');
    }

    return {
      status: true,
      message: 'Inventory item fetched successfully',
      data: result[0],
    };
  }

  async getItemByBranchId(branch_id: number) {
    if (!branch_id) {
      throw new BadRequestException('branch_id is required');
    }

    const result = await this.dataSource.query(
      `SELECT 
        i.item_id, 
        i.branch_id,
        i.item_name, 
        i.category_id, 
        i.quantity, 
        i.unit_cost, 
        i.vendor
       FROM inventory i
       WHERE i.branch_id = $1 AND i.status = 1`,
      [branch_id],
    );


    return {
      status: true,
      message: result.length ? 'Inventory item fetched successfully' : 'No inventory items found in this branch',        data: result,
    };
  }

  // SOFT DELETE
  async deleteItem(item_id: number) {
    if (!item_id) {
      throw new BadRequestException('item_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT item_id FROM inventory WHERE item_id = $1 AND status = 1`,
      [item_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Item not found');
    }

    await this.dataSource.query(
      `UPDATE inventory SET status = 0, updated_at = NOW() WHERE item_id = $1`,
      [item_id],
    );

    return {
      status: true,
      message: 'Inventory item deleted successfully',
    };
  }

  // SEARCH
  async searchItems(keyword: string, page?: number, limit?: number) {
    const params: any[] = [`%${keyword}%`];
    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = `LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
      SELECT 
        i.item_id, 
        i.branch_id,
        b.branch_name,
        i.item_name, 
        i.category_id, 
        pc.category_name,
        i.quantity, 
        i.unit_cost, 
        i.vendor
      FROM inventory i
      LEFT JOIN branches b ON i.branch_id = b.branch_id
      LEFT JOIN product_categories pc ON i.category_id = pc.category_id
      WHERE i.status = 1
        AND (i.item_name ILIKE $1 OR i.vendor ILIKE $1 OR b.branch_name ILIKE $1 OR pc.category_name ILIKE $1)
      ORDER BY i.item_id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    const totalQuery = `
      SELECT COUNT(*) as count
      FROM inventory i
      LEFT JOIN branches b ON i.branch_id = b.branch_id
        LEFT JOIN product_categories pc ON i.category_id = pc.category_id
      WHERE i.status = 1
        AND (i.item_name ILIKE $1 OR i.vendor ILIKE $1 OR b.branch_name ILIKE $1 OR pc.category_name ILIKE $1)
    `;
    const totalResult = await this.dataSource.query(totalQuery, [`%${keyword}%`]);
    const totalRecords = parseInt(totalResult[0].count);

    return {
      status: true,
      message: 'Inventory search results',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // FILTER
  async filterItems(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let whereClause = `WHERE i.status = 1`;
    let idx = 1;

    // Filter by branch_id
    if (filters.branch_name) {
      whereClause += ` AND b.branch_name ILIKE $${idx++}`;
      params.push(`%${filters.branch_name}%`);
    }

    // Filter by category_id
    if (filters.category_name) {
      whereClause += ` AND pc.category_name ILIKE $${idx++}`;
      params.push(`%${filters.category_name}%`);
    }

    // Filter by item_name (partial match)
    if (filters.item_name) {
      whereClause += ` AND i.item_name ILIKE $${idx++}`;
      params.push(`%${filters.item_name}%`);
    }

    // Filter by vendor (partial match)
    if (filters.vendor) {
      whereClause += ` AND i.vendor ILIKE $${idx++}`;
      params.push(`%${filters.vendor}%`);
    }

    // // Filter by minimum quantity
    // if (filters.min_quantity !== undefined && filters.min_quantity !== null) {
    //   whereClause += ` AND i.quantity >= $${idx++}`;
    //   params.push(filters.min_quantity);
    // }

    // // Filter by maximum quantity
    // if (filters.max_quantity !== undefined && filters.max_quantity !== null) {
    //   whereClause += ` AND i.quantity <= $${idx++}`;
    //   params.push(filters.max_quantity);
    // }

    // // Filter by minimum unit_cost
    // if (filters.min_unit_cost !== undefined && filters.min_unit_cost !== null) {
    //   whereClause += ` AND i.unit_cost >= $${idx++}`;
    //   params.push(filters.min_unit_cost);
    // }

    // // Filter by maximum unit_cost
    // if (filters.max_unit_cost !== undefined && filters.max_unit_cost !== null) {
    //   whereClause += ` AND i.unit_cost <= $${idx++}`;
    //   params.push(filters.max_unit_cost);
    // }

    let query = `
      SELECT 
        i.item_id, 
        i.branch_id,
        b.branch_name,
        i.item_name, 
        i.category_id, 
        pc.category_name,
        i.quantity, 
        i.unit_cost, 
        i.vendor
      FROM inventory i
      LEFT JOIN branches b ON i.branch_id = b.branch_id
      LEFT JOIN product_categories pc ON i.category_id = pc.category_id
      ${whereClause}
      ORDER BY i.item_id DESC
    `;

    // Pagination
    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(query, params);

    // If no pagination, return full data
    if (!page || !limit) {
      return {
        status: true,
        message: 'Inventory filtered successfully',
        data,
        totalRecords: data.length,
      };
    }

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as count
      FROM inventory i
      LEFT JOIN branches b ON i.branch_id = b.branch_id
      LEFT JOIN product_categories pc ON i.category_id = pc.category_id
      ${whereClause}
    `;

    const countParams = params.slice(0, params.length - 2); // exclude LIMIT & OFFSET
    const countResult = await this.dataSource.query(countQuery, countParams);
    const totalRecords = Number(countResult[0].count);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      status: true,
      message: 'Inventory filtered successfully',
      data,
      totalRecords,
      totalPages,
    };
  }
}

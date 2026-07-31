// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { DataSource } from 'typeorm';
// import { CreateAssetDto } from './asset.dto';

// @Injectable()
// export class AssetService {
//   constructor(private readonly dataSource: DataSource) {}

//   // CREATE
//   async create(dto: CreateAssetDto) {
//     await this.dataSource.query(
//       `
//       INSERT INTO assets
//       (asset_name, category, purchase_date, cost, location, warranty_expiry, asset_status, status)
//       VALUES ($1,$2,$3,$4,$5,$6,$7,1)
//       `,
//       [
//         dto.asset_name,
//         dto.category,
//         dto.purchase_date,
//         dto.cost,
//         dto.location,
//         dto.warranty_expiry ?? null,
//         dto.asset_status ?? 'working',
//       ],
//     );

//     return { status: true, message: 'Asset created successfully' };
//   }

//   // UPDATE
//   async update(asset_id: number, dto: any) {
//     if (!asset_id) throw new BadRequestException('asset_id is required');

//     const exists = await this.dataSource.query(
//       `SELECT asset_id FROM assets WHERE asset_id = $1 AND status = 1`,
//       [asset_id],
//     );

//     if (exists.length === 0) {
//       throw new NotFoundException('Asset not found');
//     }

//     await this.dataSource.query(
//       `
//       UPDATE assets SET
//         asset_name = $1,
//         category = $2,
//         purchase_date = $3,
//         cost = $4,
//         location = $5,
//         warranty_expiry = $6,
//         asset_status = $7
//       WHERE asset_id = $8
//       `,
//       [
//         dto.asset_name,
//         dto.category,
//         dto.purchase_date,
//         dto.cost,
//         dto.location,
//         dto.warranty_expiry ?? null,
//         dto.asset_status ?? 'working',
//         asset_id,
//       ],
//     );

//     return { status: true, message: 'Asset updated successfully' };
//   }

//   // GET ALL
//   async getAll(page?: number, limit?: number) {
//     let query = `
//       SELECT
//         asset_id,
//         asset_name,
//         category,
//         purchase_date,
//         cost,
//         location,
//         warranty_expiry,
//         asset_status
//       FROM assets
//       WHERE status = 1
//       ORDER BY asset_id DESC
//     `;

//     if (!page || !limit) {
//       const data = await this.dataSource.query(query);
//       return {
//         status: true,
//         message: 'All assets fetched successfully',
//         data,
//         totalRecords: data.length,
//       };
//     }

//     const offset = (page - 1) * limit;
//     query += ` LIMIT $1 OFFSET $2`;

//     const data = await this.dataSource.query(query, [limit, offset]);
//     const count = await this.dataSource.query(
//       `SELECT COUNT(*) FROM assets WHERE status = 1`,
//     );

//     return {
//       status: true,
//       message: 'Paginated assets fetched successfully',
//       data,
//       totalRecords: Number(count[0].count),
//       totalPages: Math.ceil(count[0].count / limit),
//     };
//   }

//   // GET BY ID
//   async getById(asset_id: number) {
//     if (!asset_id) throw new BadRequestException('asset_id is required');

//     const result = await this.dataSource.query(
//       `
//       SELECT
//         asset_id,
//         asset_name,
//         category,
//         purchase_date,
//         cost,
//         location,
//         warranty_expiry,
//         asset_status
//       FROM assets
//       WHERE asset_id = $1 AND status = 1
//       `,
//       [asset_id],
//     );

//     if (result.length === 0) {
//       throw new NotFoundException('Asset not found');
//     }

//     return {
//       status: true,
//       message: 'Asset fetched successfully',
//       data: result[0],
//     };
//   }

//   // DELETE (SOFT)
//   async delete(asset_id: number) {
//     if (!asset_id) throw new BadRequestException('asset_id is required');

//     const exists = await this.dataSource.query(
//       `SELECT asset_id FROM assets WHERE asset_id = $1 AND status = 1`,
//       [asset_id],
//     );

//     if (exists.length === 0) {
//       throw new NotFoundException('Asset not found');
//     }

//     await this.dataSource.query(
//       `UPDATE assets SET status = 0 WHERE asset_id = $1`,
//       [asset_id],
//     );

//     return { status: true, message: 'Asset deleted successfully' };
//   }

//   async searchAssets(keyword: string, page?: number, limit?: number) {
//     if (!keyword?.trim()) {
//       throw new BadRequestException('Search keyword is required');
//     }

//     const search = `%${keyword.trim()}%`;
//     const params: any[] = [search];

//     let pagination = '';
//     if (page && limit) {
//       pagination = ` LIMIT $2 OFFSET $3`;
//       params.push(limit, (page - 1) * limit);
//     }

//     const query = `
//     SELECT
//       asset_id,
//       asset_name,
//       category,
//       purchase_date,
//       cost,
//       location,
//       warranty_expiry,
//       asset_status
//     FROM assets
//     WHERE status = 1
//       AND (
//         asset_name ILIKE $1
//         OR category ILIKE $1
//         OR location ILIKE $1
//         OR asset_status::text ILIKE $1
//         OR TO_CHAR(purchase_date, 'YYYY-MM-DD') ILIKE $1
//         OR TO_CHAR(warranty_expiry, 'YYYY-MM-DD') ILIKE $1
//       )
//     ORDER BY asset_id DESC
//     ${pagination}
//   `;

//     const data = await this.dataSource.query(query, params);

//     const countQuery = `
//     SELECT COUNT(*)
//     FROM assets
//     WHERE status = 1
//       AND (
//         asset_name ILIKE $1
//         OR category ILIKE $1
//         OR location ILIKE $1
//         OR asset_status::text ILIKE $1
//         OR TO_CHAR(purchase_date, 'YYYY-MM-DD') ILIKE $1
//         OR TO_CHAR(warranty_expiry, 'YYYY-MM-DD') ILIKE $1
//       )
//   `;

//     const totalRecords = Number(
//       (await this.dataSource.query(countQuery, [search]))[0].count,
//     );

//     return {
//       status: true,
//       message: 'Asset search results fetched successfully',
//       data,
//       totalRecords,
//       totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
//     };
//   }

//   async filterAssets(filters: any, page?: number, limit?: number) {
//     const params: any[] = [];
//     let conditions = `WHERE status = 1`;
//     let idx = 1;

//     if (filters.asset_name?.trim()) {
//       conditions += ` AND asset_name ILIKE $${idx++}`;
//       params.push(`%${filters.asset_name.trim()}%`);
//     }

//     if (filters.category?.trim()) {
//       conditions += ` AND category ILIKE $${idx++}`;
//       params.push(`%${filters.category.trim()}%`);
//     }

//     if (filters.location?.trim()) {
//       conditions += ` AND location ILIKE $${idx++}`;
//       params.push(`%${filters.location.trim()}%`);
//     }

//     if (filters.asset_status?.trim()) {
//       conditions += ` AND asset_status = $${idx++}`;
//       params.push(filters.asset_status);
//     }

//     if (filters.purchase_date_from) {
//       conditions += ` AND purchase_date >= $${idx++}`;
//       params.push(filters.purchase_date_from);
//     }

//     if (filters.purchase_date_to) {
//       conditions += ` AND purchase_date <= $${idx++}`;
//       params.push(filters.purchase_date_to);
//     }

//     if (filters.warranty_expiry_from) {
//       conditions += ` AND warranty_expiry >= $${idx++}`;
//       params.push(filters.warranty_expiry_from);
//     }

//     if (filters.warranty_expiry_to) {
//       conditions += ` AND warranty_expiry <= $${idx++}`;
//       params.push(filters.warranty_expiry_to);
//     }

//     if (filters.min_cost !== undefined) {
//       conditions += ` AND cost >= $${idx++}`;
//       params.push(filters.min_cost);
//     }

//     if (filters.max_cost !== undefined) {
//       conditions += ` AND cost <= $${idx++}`;
//       params.push(filters.max_cost);
//     }

//     let baseQuery = `
//     SELECT
//       asset_id,
//       asset_name,
//       category,
//       purchase_date,
//       cost,
//       location,
//       warranty_expiry,
//       asset_status
//     FROM assets
//     ${conditions}
//     ORDER BY asset_id DESC
//   `;

//     if (!page || !limit) {
//       const data = await this.dataSource.query(baseQuery, params);
//       return {
//         status: true,
//         message: 'Assets filtered successfully',
//         data,
//         totalRecords: data.length,
//       };
//     }

//     const offset = (page - 1) * limit;
//     baseQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
//     params.push(limit, offset);

//     const data = await this.dataSource.query(baseQuery, params);

//     const countQuery = `
//     SELECT COUNT(*)
//     FROM assets
//     ${conditions}
//   `;
//     const countParams = params.slice(0, params.length - 2);
//     const totalRecords = Number(
//       (await this.dataSource.query(countQuery, countParams))[0].count,
//     );

//     return {
//       status: true,
//       message: 'Assets filtered successfully',
//       data,
//       totalRecords,
//       totalPages: Math.ceil(totalRecords / limit),
//     };
//   }
// }



import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AssetService {
  constructor(private readonly dataSource: DataSource) {}

  // CREATE
  async create(dto: any) {
    const now = new Date();

    const query = `
      INSERT INTO assets
      (branch_id, asset_name, category_id, location_id, status_id, purchase_date, cost, warranty_expiry, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $9)
    `;

    const values = [
      dto.branch_id,
      dto.asset_name?.trim(),
      dto.category_id,
      dto.location_id,
      dto.status_id,
      dto.purchase_date,
      Number(dto.cost),
      dto.warranty_expiry || null,
      now,
    ];

    try {
      await this.dataSource.query(query, values);
      return { status: true, message: 'Asset created successfully' };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to create asset');
    }
  }

  // UPDATE
  async update(asset_id: number, dto: any) {
    if (!asset_id) throw new BadRequestException('asset_id is required');

    const exists = await this.dataSource.query(
      `SELECT asset_id FROM assets WHERE asset_id = $1 AND status = 1`,
      [asset_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Asset not found');
    }

    const query = `
      UPDATE assets
      SET
        branch_id = $1,
        asset_name = $2,
        category_id = $3,
        location_id = $4,
        status_id = $5,
        purchase_date = $6,
        cost = $7,
        warranty_expiry = $8,
        updated_at = NOW()
      WHERE asset_id = $9
    `;

    const values = [
      dto.branch_id,
      dto.asset_name?.trim(),
      dto.category_id,
      dto.location_id,
      dto.status_id,
      dto.purchase_date,
      Number(dto.cost),
      dto.warranty_expiry || null,
      asset_id,
    ];

    await this.dataSource.query(query, values);

    return { status: true, message: 'Asset updated successfully' };
  }

  // GET ALL (WITH PAGINATION)
  async getAll(page?: number, limit?: number) {
    let baseQuery = `
      SELECT 
        a.asset_id,
        a.branch_id,
        b.branch_name,
        a.asset_name,
        a.category_id,
        cat.category_name AS category,
        a.location_id,
        loc.location_name AS location,
        a.status_id,
        st.status_name AS asset_status,
        a.purchase_date,
        a.cost,
        a.warranty_expiry
      FROM assets a
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      LEFT JOIN asset_categories cat ON cat.category_id = a.category_id
      LEFT JOIN asset_locations loc ON loc.location_id = a.location_id
      LEFT JOIN asset_status st ON st.status_id = a.status_id
      WHERE a.status = 1
      ORDER BY a.asset_id DESC
    `;

    const params: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(baseQuery, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM assets WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Assets fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // GET BY ID
  async getById(asset_id: number) {
    if (!asset_id) throw new BadRequestException('asset_id is required');

    const query = `
      SELECT 
        a.asset_id,
        a.branch_id,
        b.branch_name,
        a.asset_name,
        a.category_id,
        cat.category_name AS category,
        a.location_id,
        loc.location_name AS location,
        a.status_id,
        st.status_name AS asset_status,
        a.purchase_date,
        a.cost,
        a.warranty_expiry
      FROM assets a
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      LEFT JOIN asset_categories cat ON cat.category_id = a.category_id
      LEFT JOIN asset_locations loc ON loc.location_id = a.location_id
      LEFT JOIN asset_status st ON st.status_id = a.status_id
      WHERE a.asset_id = $1 AND a.status = 1
    `;

    const result = await this.dataSource.query(query, [asset_id]);

    if (result.length === 0) {
      throw new NotFoundException('Asset not found');
    }

    return {
      status: true,
      message: 'Asset fetched successfully',
      data: result[0],
    };
  }

  // SOFT DELETE
  async delete(asset_id: number) {
    if (!asset_id) throw new BadRequestException('asset_id is required');

    const exists = await this.dataSource.query(
      `SELECT asset_id FROM assets WHERE asset_id = $1 AND status = 1`,
      [asset_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Asset not found');
    }

    await this.dataSource.query(
      `UPDATE assets SET status = 0, updated_at = NOW() WHERE asset_id = $1`,
      [asset_id],
    );

    return { status: true, message: 'Asset deleted successfully' };
  }

  // SEARCH
  async searchAssets(keyword: string, page?: number, limit?: number) {
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
        a.asset_id,
        a.branch_id,
        b.branch_name,
        a.asset_name,
        a.category_id,
        cat.category_name AS category,
        a.location_id,
        loc.location_name AS location,
        a.status_id,
        st.status_name AS asset_status,
        a.purchase_date,
        a.cost,
        a.warranty_expiry
      FROM assets a
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      LEFT JOIN asset_categories cat ON cat.category_id = a.category_id
      LEFT JOIN asset_locations loc ON loc.location_id = a.location_id
      LEFT JOIN asset_status st ON st.status_id = a.status_id
      WHERE a.status = 1
        AND (
          a.asset_name ILIKE $1
          OR b.branch_name ILIKE $1
          OR cat.category_name ILIKE $1
          OR loc.location_name ILIKE $1
          OR st.status_name ILIKE $1
          OR TO_CHAR(a.purchase_date, 'YYYY-MM-DD') ILIKE $1
          OR TO_CHAR(a.warranty_expiry, 'YYYY-MM-DD') ILIKE $1
        )
      ORDER BY a.asset_id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM assets a
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      LEFT JOIN asset_categories cat ON cat.category_id = a.category_id
      LEFT JOIN asset_locations loc ON loc.location_id = a.location_id
      LEFT JOIN asset_status st ON st.status_id = a.status_id
      WHERE a.status = 1
        AND (
          a.asset_name ILIKE $1
          OR b.branch_name ILIKE $1
          OR cat.category_name ILIKE $1
          OR loc.location_name ILIKE $1
          OR st.status_name ILIKE $1
          OR TO_CHAR(a.purchase_date, 'YYYY-MM-DD') ILIKE $1
          OR TO_CHAR(a.warranty_expiry, 'YYYY-MM-DD') ILIKE $1
        )
    `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Asset search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // FILTER
  async filterAssets(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE a.status = 1`;
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name = $${idx++}`;
      params.push(filters.branch_name);
    }

    if (filters.category_name) {
      conditions += ` AND cat.category_name= $${idx++}`;
      params.push(filters.category_name);
    }

    if (filters.location_name) {
      conditions += ` AND loc.location_name = $${idx++}`;
      params.push(filters.location_name);
    }

    if (filters.status_name) {
      conditions += ` AND st.status_name = $${idx++}`;
      params.push(filters.status_name);
    }

    if (filters.asset_name?.trim()) {
      conditions += ` AND a.asset_name ILIKE $${idx++}`;
      params.push(`%${filters.asset_name.trim()}%`);
    }

    // if (filters.purchase_date_from) {
    //   conditions += ` AND a.purchase_date >= $${idx++}`;
    //   params.push(filters.purchase_date_from);
    // }

    // if (filters.purchase_date_to) {
    //   conditions += ` AND a.purchase_date <= $${idx++}`;
    //   params.push(filters.purchase_date_to);
    // }

    // if (filters.warranty_expiry_from) {
    //   conditions += ` AND a.warranty_expiry >= $${idx++}`;
    //   params.push(filters.warranty_expiry_from);
    // }

    // if (filters.warranty_expiry_to) {
    //   conditions += ` AND a.warranty_expiry <= $${idx++}`;
    //   params.push(filters.warranty_expiry_to);
    // }

    // if (filters.min_cost !== undefined) {
    //   conditions += ` AND a.cost >= $${idx++}`;
    //   params.push(filters.min_cost);
    // }

    // if (filters.max_cost !== undefined) {
    //   conditions += ` AND a.cost <= $${idx++}`;
    //   params.push(filters.max_cost);
    // }

    const baseQuery = `
      SELECT 
        a.asset_id,
        a.branch_id,
        b.branch_name,
        a.asset_name,
        a.category_id,
        cat.category_name AS category,
        a.location_id,
        loc.location_name AS location,
        a.status_id,
        st.status_name AS asset_status,
        a.purchase_date,
        a.cost,
        a.warranty_expiry
      FROM assets a
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      LEFT JOIN asset_categories cat ON cat.category_id = a.category_id
      LEFT JOIN asset_locations loc ON loc.location_id = a.location_id
      LEFT JOIN asset_status st ON st.status_id = a.status_id
      ${conditions}
      ORDER BY a.asset_id ASC
    `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Assets filtered successfully',
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
      FROM assets a
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      LEFT JOIN asset_categories cat ON cat.category_id = a.category_id
      LEFT JOIN asset_locations loc ON loc.location_id = a.location_id
      LEFT JOIN asset_status st ON st.status_id = a.status_id
      ${conditions}
    `;

    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Assets filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }
}
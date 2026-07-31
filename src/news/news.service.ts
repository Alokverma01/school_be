
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateNewsDto } from './create-news.dto';

@Injectable()
export class NewsService {
  constructor(private readonly dataSource: DataSource) {}

  async create(dto: CreateNewsDto) {
    const query = `
      INSERT INTO news 
        (news_code, branch_id, news_date, news_title, message, status, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, 1, NOW(), NOW())
      RETURNING news_id
    `;

    const params = [
      dto.news_code,
      dto.branch_id,
      dto.news_date,
      dto.news_title,
      dto.message,
    ];

    try {
      const result = await this.dataSource.query(query, params);
      return {
        status: true,
        message: 'News created successfully',
        news_id: result[0].news_id,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create news: ${error.message}`);
    }
  }

  async findAll(page?: number, limit?: number) {
    let newsList;
    let totalRecords = 0;

    if (page && limit) {
      const offset = (page - 1) * limit;
      newsList = await this.dataSource.query(
        `
        SELECT 
          n.news_id, n.news_code, n.news_date, n.branch_id, n.news_title, n.message,
          b.branch_name
        FROM news n
        LEFT JOIN branches b ON b.branch_id = n.branch_id
        WHERE n.status = 1
        ORDER BY n.news_id ASC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset],
      );

      const countResult = await this.dataSource.query(
        `SELECT COUNT(*) FROM news WHERE status = 1`,
      );
      totalRecords = Number(countResult[0].count);
    } else {
      newsList = await this.dataSource.query(
        `
        SELECT 
          news_id, news_code, news_date, branch_id, news_title, message
        FROM news
        WHERE status = 1
        ORDER BY news_id DESC
        `,
      );
      totalRecords = newsList.length;
    }

    return {
      status: true,
      message: limit ? 'Paginated News Fetched' : 'News Fetched Successfully',
      data: newsList,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async findById(news_id: number) {
    if (!news_id) throw new BadRequestException('news_id is required');

    const result = await this.dataSource.query(
      `
      SELECT 
        news_id, news_code, news_date, branch_id, news_title, message
      FROM news 
      WHERE news_id = $1 AND status = 1 
      LIMIT 1
      `,
      [news_id],
    );

    if (!result.length) throw new NotFoundException('News not found');

    return {
      status: true,
      message: 'News fetched successfully',
      data: result[0],
    };
  }

  async update(news_id: number, dto: CreateNewsDto) {
    if (!news_id) throw new BadRequestException('news_id is required');

    const existing = await this.dataSource.query(
      `SELECT news_id FROM news WHERE news_id = $1 AND status = 1 LIMIT 1`,
      [news_id],
    );

    if (!existing.length) throw new NotFoundException('News not found');

    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dto.news_code !== undefined) {
      fields.push(`news_code = $${idx++}`);
      params.push(dto.news_code);
    }
    if (dto.branch_id !== undefined) {
      fields.push(`branch_id = $${idx++}`);
      params.push(dto.branch_id);
    }
    if (dto.news_date !== undefined) {
      fields.push(`news_date = $${idx++}`);
      params.push(dto.news_date);
    }
    if (dto.news_title !== undefined) {
      fields.push(`news_title = $${idx++}`);
      params.push(dto.news_title);
    }
    if (dto.message !== undefined) {
      fields.push(`message = $${idx++}`);
      params.push(dto.message);
    }

    if (fields.length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    params.push(news_id);
    const query = `
      UPDATE news 
      SET ${fields.join(', ')}, updated_at = NOW() 
      WHERE news_id = $${idx}
    `;

    await this.dataSource.query(query, params);

    return { status: true, message: 'News updated successfully' };
  }

  async delete(news_id: number) {
    if (!news_id) throw new BadRequestException('news_id is required');

    const existing = await this.dataSource.query(
      `SELECT news_id FROM news WHERE news_id = $1 AND status = 1 LIMIT 1`,
      [news_id],
    );

    if (!existing.length) throw new NotFoundException('News not found');

    await this.dataSource.query(
      `UPDATE news SET status = 0, updated_at = NOW() WHERE news_id = $1`,
      [news_id],
    );

    return { status: true, message: 'News deleted successfully' };
  }

  async searchNews(keyword: string, page?: number, limit?: number) {
    if (!keyword) throw new BadRequestException('keyword is required');

    keyword = `%${keyword}%`;
    let params: any[] = [keyword];
    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = `LIMIT $2 OFFSET $3`;
      params = [keyword, limit, offset];
    }

    const query = `
      SELECT 
        n.news_id, n.news_code, n.news_date, n.branch_id, n.news_title, n.message,
        b.branch_name
      FROM news n
      LEFT JOIN branches b ON b.branch_id = n.branch_id
      WHERE n.status = 1 
        AND (b.branch_name ILIKE $1 OR n.news_title ILIKE $1 OR n.news_code ILIKE $1 OR n.message ILIKE $1)
      ORDER BY n.news_id DESC
      ${pagination}
    `;

    const newsList = await this.dataSource.query(query, params);

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM news n
      LEFT JOIN branches b ON b.branch_id = n.branch_id
      WHERE n.status = 1 
        AND (b.branch_name ILIKE $1 OR n.news_title ILIKE $1 OR n.news_code ILIKE $1 OR n.message ILIKE $1)`,
      [keyword],
    );
    const totalRecords = Number(countResult[0].count);

    return {
      status: true,
      message: 'News search completed',
      data: newsList,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterNews(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = 'WHERE n.status = 1';
    let idx = 1;

    if (filters.news_code) {
      conditions += ` AND n.news_code ILIKE $${idx++}`;
      params.push(`%${filters.news_code}%`);
    }

    if (filters.news_title) {
      conditions += ` AND n.news_title ILIKE $${idx++}`;
      params.push(`%${filters.news_title}%`);
    }

    if (filters.branch_name) {
      conditions += ` AND b.branch_name ILIKE $${idx++}`; // Changed to ILIKE for consistency
      params.push(`%${filters.branch_name}%`);
    }

    if (filters.from_date) {
      conditions += ` AND n.news_date >= $${idx++}`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      conditions += ` AND n.news_date <= $${idx++}`;
      params.push(filters.to_date);
    }

    let pagination = '';
    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    // Main query - uses alias n and b
    const query = `
    SELECT 
      n.news_id, 
      n.news_code, 
      n.news_date, 
      n.branch_id, 
      n.news_title, 
      n.message,
      b.branch_name
    FROM news n
    LEFT JOIN branches b ON b.branch_id = n.branch_id
    ${conditions}
    ORDER BY n.news_id DESC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    // Count query - MUST also use the same alias n (and join if needed)
    const countParams = params.slice(
      0,
      params.length - (page && limit ? 2 : 0),
    );
    const countQuery = `
    SELECT COUNT(*) 
    FROM news n
    LEFT JOIN branches b ON b.branch_id = n.branch_id
    ${conditions}
  `;

    const countResult = await this.dataSource.query(countQuery, countParams);
    const totalRecords = Number(countResult[0].count);

    return {
      status: true,
      message: 'Filtered News Retrieved',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }
}

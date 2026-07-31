import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ClassesService {
  constructor(private dataSource: DataSource) { }

  async createClass(body) {
    const { class_name, branch_id, sections } = body;

    if (!class_name || !branch_id || !sections || sections.length === 0) {
      throw new BadRequestException('Missing required fields');
    }

    const exists = await this.dataSource.query(
      `SELECT class_id FROM classes WHERE class_name = $1 AND branch_id = $2 LIMIT 1`,
      [class_name, branch_id],
    );

    if (exists.length > 0) {
      throw new BadRequestException(
        'Class with the same name already exists in this branch',
      );
    } 

    // Insert Class
    const classResult = await this.dataSource.query(
      `INSERT INTO classes (class_name, branch_id) VALUES ($1, $2) RETURNING class_id`,
      [class_name, branch_id],
    );

    const class_id = classResult[0].class_id;

    // Insert Assigned Sections
    for (const section_id of sections) {
      await this.dataSource.query(
        `INSERT INTO class_section_assign (class_id, section_id, branch_id) VALUES ($1, $2, $3)`,
        [class_id, section_id, branch_id],
      );
    }

    return {
      status: true,
      message: 'Class created successfully',
      class_id,
    };
  }

  // cs.section_id,
  // s.section_name,
  // cs.teacher_id,
  // CONCAT(t.first_name , ' ', t.last_name) as teacher_name,
  // cs.capacity,
  // cs.no_of_boys,
  // cs.no_of_girls

  async getAllClass(page?: number, limit?: number) {
    let baseQuery = `
    SELECT 
      c.class_id,
      c.class_name,
      c.branch_id,
      b.branch_name
    FROM classes c 
    LEFT JOIN branches b ON b.branch_id = c.branch_id
    WHERE c.status = 1
    ORDER BY c.class_id DESC
  `;

    const params: any[] = [];

    // Pagination
    if (page && limit) {
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const classes = await this.dataSource.query(baseQuery, params);

    // Get total count
    const totalCountResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM classes WHERE status = 1`,
    );

    const totalRecords = Number(totalCountResult[0].count);

    return {
      status: true,
      message: 'Classes fetched successfully',
      data: classes,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
      currentPage: page || 1,
    };
  }

  async updateClass(class_id: number, body: any) {
    const { class_name, branch_id, sections } = body;

    if (!class_id) {
      throw new BadRequestException('class_id is required');
    }

    if (!class_name || !branch_id || !sections || !sections.length) {
      throw new BadRequestException('Missing required fields');
    }

    // Check class exists
    const exists = await this.dataSource.query(
      `SELECT class_id FROM classes WHERE class_id = $1 AND status = 1`,
      [class_id],
    );

    if (!exists.length) {
      throw new NotFoundException('Class not found');
    }

    // Check duplicate class name in same branch (exclude self)
    const duplicate = await this.dataSource.query(
      `SELECT class_id FROM classes 
     WHERE class_name = $1 
       AND branch_id = $2 
       AND status = 1
       AND class_id <> $3`,
      [class_name, branch_id, class_id],
    );

    if (duplicate.length) {
      throw new BadRequestException(
        'Class with the same name already exists in this branch',
      );
    }

    // Update class table
    await this.dataSource.query(
      `UPDATE classes 
     SET class_name = $1, branch_id = $2, updated_at = NOW()
     WHERE class_id = $3`,
      [class_name, branch_id, class_id],
    );

    // Existing sections
    const existing = await this.dataSource.query(
      `SELECT section_id FROM class_section_assign WHERE class_id = $1`,
      [class_id],
    );

    const existingIds = existing.map((e) => e.section_id);

    // Sections to add
    const toInsert = sections.filter((id) => !existingIds.includes(id));

    // Sections to remove
    const toDelete = existingIds.filter((id) => !sections.includes(id));

    // Delete removed sections
    if (toDelete.length) {
      await this.dataSource.query(
        `DELETE FROM class_section_assign 
       WHERE class_id = $1 
         AND section_id = ANY($2)`,
        [class_id, toDelete],
      );
    }

    // Insert new sections
    for (const section_id of toInsert) {
      await this.dataSource.query(
        `INSERT INTO class_section_assign (class_id, section_id, branch_id)
       VALUES ($1, $2, $3)`,
        [class_id, section_id, branch_id],
      );
    }

    return {
      status: true,
      message: 'Class updated successfully',
      class_id,
    };
  }

  async getClassById(class_id: number) {
    if (!class_id) {
      throw new BadRequestException('class_id is required');
    }

    const query = `
    SELECT 
      c.class_id,
      c.class_name,
      c.branch_id,
      b.branch_name,
      ARRAY_AGG(DISTINCT csa.section_id) AS section_ids
    FROM classes c
    LEFT JOIN branches b 
      ON b.branch_id = c.branch_id
    LEFT JOIN class_section_assign csa 
      ON csa.class_id = c.class_id AND csa.status = 1
    WHERE c.class_id = $1
      AND c.status = 1
    GROUP BY 
      c.class_id, 
      c.class_name, 
      c.branch_id, 
      b.branch_name
  `;

    const result = await this.dataSource.query(query, [class_id]);

    if (!result.length) {
      throw new NotFoundException('Class not found');
    }

    return {
      status: true,
      message: 'Class fetched successfully',
      data: result[0],
    };
  }

  async getClassByBranch(branch_id: number) {
    if (!branch_id) {
      throw new BadRequestException('branch_id is required');
    }

    const classes = await this.dataSource.query(
      `SELECT class_id, class_name FROM classes WHERE branch_id = $1 AND status = 1 ORDER BY class_id ASC`,
      [branch_id],
    );


    return {
      status: true,
      message: classes?.length ? 'Classes fetched' : 'No classes found in this branch',
      data: classes,
    };
  }

  async getSectionsByClass(class_id: number) {
    if (!class_id) {
      throw new BadRequestException('class_id is required');
    }

    const sections = await this.dataSource.query(
      `SELECT 
          csa.section_id, 
          s.section_name,
          csa.teacher_id,
          CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
          csa.room_id,
          r.name as room_name
        FROM class_section_assign csa
        LEFT JOIN sections s ON csa.section_id = s.section_id
        LEFT JOIN teachers t ON t.teacher_id = csa.teacher_id
        LEFT JOIN rooms r ON r.id = csa.room_id
        WHERE csa.class_id = $1 AND csa.status = 1
        ORDER BY s.section_name ASC
        `,
      [class_id],
    );

    return {
      status: true,
      message: sections?.length ? 'Sections By Class fetched' : "No sections found in this class",
      data: sections,
    };
  }

  async deleteClass(class_id: number) {
    if (!class_id) {
      throw new BadRequestException('class_id is required');
    }

    // Check class exists & active
    const exists = await this.dataSource.query(
      `SELECT class_id FROM classes WHERE class_id = $1 AND status = 1`,
      [class_id],
    );

    if (!exists.length) {
      throw new NotFoundException('Class not found or already deleted');
    }

    // Soft delete class
    await this.dataSource.query(
      `UPDATE classes 
     SET status = 0, updated_at = NOW()
     WHERE class_id = $1`,
      [class_id],
    );

    // Soft delete assigned sections
    await this.dataSource.query(
      `UPDATE class_section_assign
     SET status = 0, updated_at = NOW()
     WHERE class_id = $1`,
      [class_id],
    );

    return {
      status: true,
      message: 'Class deleted successfully',
    };
  }

  async assignClass(body) {
    const {
      branch_id,
      class_id,
      section_id,
      teacher_id,
      room_id,
    } = body;

    if (!branch_id || !class_id || !section_id) {
      throw new BadRequestException('branch_id, class_id and section_id are required');
    }

    const alreadyRoomTeacherAssigned = await this.dataSource.query(
      `SELECT id FROM class_section_assign 
       WHERE class_id = $1 AND section_id = $2 AND room_id = $3 AND teacher_id = $4 AND status = 1`,
      [class_id, section_id, room_id, teacher_id],
    );

    if (alreadyRoomTeacherAssigned.length > 0) {
      throw new BadRequestException(
        'Room and Teacher is already assigned to this class section',
      );
    }

    const exists = await this.dataSource.query(
      `SELECT class_id FROM class_section_assign WHERE branch_id = $1 AND class_id = $2 AND section_id = $3 LIMIT 1`,
      [branch_id, class_id, section_id],
    );

    if (exists.length === 0) {
      throw new BadRequestException(
        'Class and Section assignment does not exist in this branch',
      );
    }

    // Check if teacher is already assigned to another class section
    if (teacher_id) {
      const teacherAssigned = await this.dataSource.query(
        `SELECT id FROM class_section_assign 
         WHERE teacher_id = $1 AND status = 1 
         AND (class_id <> $2 OR section_id <> $3)`,
        [teacher_id, class_id, section_id],
      );

      if (teacherAssigned.length > 0) {
        throw new BadRequestException(
          'Teacher is already assigned as a class teacher to another class section',
        );
      }
    }

    if (room_id) {
      const roomAssigned = await this.dataSource.query(
        `SELECT id FROM class_section_assign 
         WHERE room_id = $1 AND status = 1 
         AND (class_id <> $2 OR section_id <> $3)`,
        [room_id, class_id, section_id],
      );

      if (roomAssigned.length > 0) {
        throw new BadRequestException(
          'Room is already assigned to another class section',
        );
      }

      const room = await this.dataSource.query(
        `SELECT capacity FROM rooms WHERE id = $1 AND status = 1`,
        [room_id],
      );

      if (room.length === 0) {
        throw new NotFoundException('Room not found');
      }
    }

    await this.dataSource.query(
      `UPDATE class_section_assign 
       SET teacher_id = $1, room_id = $2, updated_at = NOW()
       WHERE branch_id = $3 AND class_id = $4 AND section_id = $5`,
      [teacher_id, room_id, branch_id, class_id, section_id],
    );

    return {
      status: true,
      message: 'Class assigned successfully',
    };
  }

  async getAllAssignClass(branch_id?: number, page?: number, limit?: number) {
    let baseQuery = `
    SELECT 
      b.branch_id,
      b.branch_name,
      c.class_id,
      c.class_name,
      ARRAY_AGG(
        JSON_BUILD_OBJECT(
          'id', csa.id,
          'section_id', s.section_id,
          'section_name', s.section_name,
          'teacher_id', t.teacher_id,
          'teacher_name', CONCAT(t.first_name, ' ', t.last_name),
          'room_id', r.id,
          'room_name', r.name
        )
      ) AS sections
    FROM class_section_assign csa
    LEFT JOIN classes c ON c.class_id = csa.class_id
    LEFT JOIN sections s ON s.section_id = csa.section_id
    LEFT JOIN teachers t ON t.teacher_id = csa.teacher_id
    LEFT JOIN branches b ON b.branch_id = csa.branch_id
    LEFT JOIN rooms r ON r.id = csa.room_id
    WHERE c.status = 1 AND csa.status = 1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (branch_id) {
      baseQuery += ` AND c.branch_id = $${paramIndex++}`;
      params.push(branch_id);
    }

    baseQuery += ` GROUP BY c.class_id, c.class_name, b.branch_id, b.branch_name ORDER BY c.class_id DESC`;

    if (page && limit) {
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(baseQuery, params);

    const totalCountQuery = branch_id
      ? `SELECT COUNT(DISTINCT class_id) FROM classes WHERE status = 1 AND branch_id = $1`
      : `SELECT COUNT(DISTINCT class_id) FROM classes WHERE status = 1`;

    const totalCountResult = await this.dataSource.query(totalCountQuery, branch_id ? [branch_id] : []);

    const totalRecords = Number(totalCountResult[0].count);

    return {
      status: true,
      message: 'Assigned classes fetched successfully',
      data,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
      currentPage: page || 1,
    };
  }

  async getAssignClassById(id: number) {
    if (!id) {
      throw new BadRequestException('ID is required');
    }

    const query = `
    SELECT 
      csa.id,
      csa.branch_id,
      csa.class_id,
      csa.section_id,
      csa.teacher_id,
      csa.room_id
    FROM class_section_assign csa
    LEFT JOIN classes c ON c.class_id = csa.class_id
    LEFT JOIN sections s ON s.section_id = csa.section_id
    LEFT JOIN teachers t ON t.teacher_id = csa.teacher_id
    LEFT JOIN branches b ON b.branch_id = csa.branch_id
    LEFT JOIN rooms r ON r.id = csa.room_id
    WHERE csa.id = $1 AND csa.status = 1
    `;

    const result = await this.dataSource.query(query, [id]);

    if (!result.length) {
      throw new NotFoundException('Assignment not found');
    }

    return {
      status: true,
      message: 'Assigned class fetched successfully',
      data: result[0],
    };
  }

  async search(keyword?: string, page?: number, limit?: number) {
    let baseQuery = `
    SELECT 
      c.class_id,
      c.class_name,
      c.branch_id,
      b.branch_name
    FROM classes c 
    LEFT JOIN branches b ON b.branch_id = c.branch_id
    WHERE c.status = 1
  `;

    const params: any[] = [];

    // Apply keyword filter
    if (keyword && keyword.trim() !== '') {
      keyword = `%${keyword}%`;
      baseQuery += ` 
      AND (
        c.class_name ILIKE $1 
        OR b.branch_name ILIKE $1
      )
    `;
      params.push(keyword);
    }

    baseQuery += ` ORDER BY c.class_id DESC`;

    // Pagination
    if (page && limit) {
      const offset = (page - 1) * limit;
      baseQuery +=
        params.length > 0 ? ` LIMIT $2 OFFSET $3` : ` LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(baseQuery, params);

    // Total Count
    const totalQuery = `
    SELECT COUNT(*) 
    FROM classes c 
    LEFT JOIN branches b ON b.branch_id = c.branch_id
    WHERE c.status = 1
    ${keyword ? `AND (c.class_name ILIKE '${keyword}' OR b.branch_name ILIKE '${keyword}')` : ''}
  `;

    const totalResult = await this.dataSource.query(totalQuery);
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: keyword ? 'Filtered Search Results' : 'Full Records',
      data,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filter(filters: any, page?: number, limit?: number) {
    const conditions: string[] = [`c.status = 1`];
    const params: any[] = [];
    let paramIndex = 1;

    // ----------- Dynamic Filters -----------

    if (filters.class_name) {
      conditions.push(`LOWER(c.class_name) LIKE $${paramIndex++}`);
      params.push(`%${filters.class_name.toLowerCase()}%`);
    }

    if (filters.branch_id) {
      conditions.push(`c.branch_id = $${paramIndex++}`);
      params.push(filters.branch_id);
    }

    // if (filters.branch_name) {
    //   conditions.push(`LOWER(b.branch_name) LIKE $${paramIndex++}`);
    //   params.push(`%${filters.branch_name.toLowerCase()}%`);
    // }

    // Optional date filtering if future audit needed
    if (filters.from_date) {
      conditions.push(`c.created_at >= $${paramIndex++}`);
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      conditions.push(`c.created_at <= $${paramIndex++}`);
      params.push(filters.to_date);
    }

    // -------- Base Query --------

    let query = `
    SELECT 
      c.class_id,
      c.class_name,
      c.branch_id,
      b.branch_name
    FROM classes c 
    LEFT JOIN branches b ON b.branch_id = c.branch_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.class_id DESC
  `;

    // -------- Pagination --------

    const paginationParams: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      paginationParams.push(limit, offset);
    }

    const finalParams = [...params, ...paginationParams];

    const data = await this.dataSource.query(query, finalParams);

    // -------- Count Query --------

    const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM classes c 
    LEFT JOIN branches b ON b.branch_id = c.branch_id
    WHERE ${conditions.join(' AND ')}
  `;

    const totalResult = await this.dataSource.query(countQuery, params);
    const totalRecords = totalResult[0]?.count ?? 0;

    return {
      status: true,
      message: 'Filtered Class Results',
      data,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }
}

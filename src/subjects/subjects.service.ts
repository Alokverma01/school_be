import { Subject } from './subject.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, Injectable, Query, Body } from '@nestjs/common';
import { AssignTeacherSubjectDto } from './subject.dto';

@Injectable()
export class SubjectsService {
  constructor(readonly dataSource: DataSource) { }

  // subjects
  async createSubject(body: any) {
    // If a `name` is provided but no master_subject_id, try to find or create the master_subject

    console.log("body", body)
    let masterSubjectId = body.master_subject_id ?? null;
    if ((!masterSubjectId || masterSubjectId === null) && body.name && String(body.name).trim()) {
      const trimmed = String(body.name).trim();
      const found = await this.dataSource.query(
        `SELECT id FROM master_subjects WHERE LOWER(subject_name) = LOWER($1) AND status = 1 LIMIT 1`,
        [trimmed],
      );

      if (found.length > 0) {
        masterSubjectId = found[0].id;
      } else {
        const inserted = await this.dataSource.query(
          `INSERT INTO master_subjects (subject_name, status, created_at, updated_at) VALUES ($1, 1, NOW(), NOW()) RETURNING id`,
          [trimmed],
        );
        masterSubjectId = inserted[0].id;
      }
    }

    // Ensure code uniqueness first
    const codeExists = await this.dataSource.query(
      `SELECT id FROM subjects WHERE code = $1 LIMIT 1`,
      [body.code],
    );

    if (codeExists.length > 0) {
      throw new BadRequestException('Subject code already exists');
    }

    // Prevent duplicate subject for same class/branch/master_subject_id (handles NULLs)
    const exists = await this.dataSource.query(
      `SELECT id FROM subjects WHERE master_subject_id IS NOT DISTINCT FROM $1 AND branch_id = $2 AND class_id = $3 LIMIT 1`,
      [masterSubjectId, body.branch_id, body.class_id],
    );

    if (exists.length > 0) {
      throw new BadRequestException('Subject already exists for this class and branch');
    }

    // Insert the subject
    const insertQuery = `
        INSERT INTO subjects (branch_id, class_id, master_subject_id, code, type)
         VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;

    const inserted = await this.dataSource.query(insertQuery, [
      body.branch_id,
      body.class_id,
      masterSubjectId,
      body.code,
      body.type,
    ]);

    const createdId = inserted[0]?.id;

    // Fetch the created subject along with master_subject_name for the response
    const created = await this.dataSource.query(
      `SELECT 
         s.id,
         s.branch_id,
         s.class_id,
         s.master_subject_id,
         ms.subject_name as master_subject_name,
         s.code,
         s.type
       FROM subjects s
       LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
       WHERE s.id = $1 AND s.status = 1
       LIMIT 1`,
      [createdId],
    );

    return {
      status: true,
      message: 'Subject created successfully',
      data: created[0] || null,
    };
  }

  async updateSubject(subject_id: number, body: any) {
    if (!subject_id) {
      throw new BadRequestException('subject_id is required');
    }

    const subject = await this.dataSource.query(
      `SELECT id FROM subjects WHERE id = $1 LIMIT 1`,
      [subject_id],
    );

    if (subject.length === 0) {
      throw new BadRequestException('Subject not found');
    }

    let query = `
        UPDATE subjects
            SET code = $1, type = $2 , class_id = $3 , branch_id = $4, master_subject_id = $5
        WHERE id = $6
    `;
    await this.dataSource.query(query, [
      body.code,
      body.type,
      body.class_id,
      body.branch_id,
      body.master_subject_id ?? null,
      subject_id,
    ]);

    return {
      status: true,
      message: 'Subject updated successfully',
    };
  }

  async getAllSubjects(page?: number, limit?: number) {
    let query = `SELECT 
    s.id,
    s.branch_id,
    b.branch_name,
    s.class_id,
    c.class_name as class_name,
    s.master_subject_id,
    ms.subject_name as master_subject_name,
    s.code,
    s.type
    From subjects s
    Left JOIN classes c ON s.class_id = c.class_id
    Left JOIN branches b ON b.branch_id = s.branch_id
    Left JOIN master_subjects ms ON ms.id = s.master_subject_id
    WHERE s.status = 1
    ORDER BY id ASC`;

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    const subjects = await this.dataSource.query(query);

    const totalRecordsResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM subjects WHERE status = 1`,
    );
    const totalRecords = parseInt(totalRecordsResult[0].count);

    return {
      status: true,
      message: 'Subjects fetched successfully',
      data: subjects,
      totalRecords: totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async getsubjectById(subject_id: number) {
    if (!subject_id) {
      throw new BadRequestException('subject_id is required');
    }
    const subject = await this.dataSource.query(
      `SELECT id FROM subjects WHERE id = $1 LIMIT 1`,
      [subject_id],
    );
    if (subject.length === 0) {
      throw new BadRequestException('Subject not found');
    }

    let query = `
        SELECT 
        s.id,
        s.branch_id,
        s.class_id,
        s.master_subject_id,
        ms.subject_name as master_subject_name,
        s.code,
        s.type
        From subjects s
        Left JOIN master_subjects ms ON ms.id = s.master_subject_id
        WHERE s.id = $1 AND s.status = 1
    `;

    const Subject = await this.dataSource.query(query, [subject_id]);

    return {
      status: true,
      message: 'Subject By id fetched successfully',
      data: Subject[0],
    };
  }

  async getsubjectByBranchAndClassId(class_id: number, branch_id: number) {
    if (!class_id || !branch_id) {
      throw new BadRequestException('class_id and branch_id are required');
    }

    console.log(branch_id, class_id);
    const subject = await this.dataSource.query(
      `SELECT s.id, s.master_subject_id, ms.subject_name as master_subject_name 
       FROM subjects s
       LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
       WHERE s.class_id = $1 AND s.branch_id = $2 AND s.status = 1`,
      [class_id, branch_id],
    );

    console.log(subject);

    return {
      status: true,
      message: subject?.length ? 'Subject fetched' : 'No Subject found in this branch',
      data: subject,
    };
  }

  async deleteSubject(subject_id: number) {
    if (!subject_id) {
      throw new BadRequestException('subject_id is required');
    }
    const subject = await this.dataSource.query(
      `SELECT id FROM subjects WHERE id = $1 LIMIT 1`,
      [subject_id],
    );
    if (subject.length === 0) {
      throw new BadRequestException('Subject not found');
    }
    let query = `
        UPDATE subjects
            SET status = 0
        WHERE id = $1
    `;
    await this.dataSource.query(query, [subject_id]);
    return {
      status: true,
      message: 'Subject deleted successfully',
    };
  }

  async searchSubjects(keyword: string, page?: number, limit?: number) {
    const searchTerm = `%${keyword}%`;
    const params: any[] = [searchTerm];
    let pagination = '';

    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = `LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
    SELECT 
      s.id,
      s.branch_id,
      b.branch_name,
      s.class_id,
      c.class_name,
      s.master_subject_id,
      ms.subject_name as master_subject_name,
      s.code,
      s.type::text AS type  -- Cast here so frontend gets string
    FROM subjects s
    LEFT JOIN classes c ON s.class_id = c.class_id
    LEFT JOIN branches b ON b.branch_id = s.branch_id
    LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
    WHERE s.status = 1
      AND (
        ms.subject_name ILIKE $1
        OR s.code ILIKE $1
        OR b.branch_name ILIKE $1
        OR c.class_name ILIKE $1
        OR s.type::text ILIKE $1  -- MUST cast here too!
      )
    ORDER BY s.id DESC
    ${pagination}
  `;

    const subjects = await this.dataSource.query(query, params);

    // Total count query
    const totalCountQuery = `
      SELECT COUNT(*) AS count
            FROM subjects s
      LEFT JOIN classes c ON s.class_id = c.class_id
      LEFT JOIN branches b ON s.branch_id = b.branch_id
LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
WHERE s.status = 1
AND (
    ms.subject_name ILIKE $1
    OR s.code ILIKE $1
    OR b.branch_name ILIKE $1
    OR c.class_name ILIKE $1
    OR s.type::text ILIKE $1
)
`;

    const totalRecordsResult = await this.dataSource.query(totalCountQuery, [
      searchTerm,
    ]);
    const totalRecords = parseInt(totalRecordsResult[0].count, 10);

    return {
      status: true,
      message: 'Subjects fetched successfully',
      data: subjects,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // assign teacher
  async assignTeacherSubject(body) {
    const exists = await this.dataSource.query(
      `SELECT id FROM teacher_subjects_allocation 
     WHERE teacher_id = $1 AND subject_id = $2 AND class_id = $3 AND branch_id = $4 LIMIT 1`,
      [body.teacher_id, body.subject_id, body.class_id, body.branch_id],
    );

    if (exists.length > 0) {
      throw new BadRequestException(
        'Teacher already assigned to this subject in this class.',
      );
    }

    await this.dataSource.query(
      `INSERT INTO teacher_subjects_allocation (teacher_id, subject_id, class_id, branch_id)
       VALUES ($1, $2, $3, $4)`,
      [body.teacher_id, body.subject_id, body.class_id, body.branch_id],
    );

    return {
      status: true,
      message: 'Teacher assigned successfully',
    };
  }

  async filterSubjects(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE s.status = 1`;
    let idx = 1;

    // 🔹 Filter by Branch Name (text search)
    if (filters.branch_name) {
      conditions += ` AND b.branch_name ILIKE $${idx++}`;
      params.push(`%${filters.branch_name}%`);
    }

    // 🔹 Filter by Branch Name (text search)
    if (filters.class_name) {
      conditions += ` AND c.class_name ILIKE $${idx++}`;
      params.push(`%${filters.class_name}%`);
    }

    // 🔹 Filter by Subject Name (via master_subjects)
    if (filters.name) {
      conditions += ` AND ms.subject_name ILIKE $${idx++}`;
      params.push(`%${filters.name}%`);
    }

    // 🔹 Filter by Subject Code
    if (filters.code) {
      conditions += ` AND s.code ILIKE $${idx++}`;
      params.push(`%${filters.code}%`);
    }

    // 🔹 Filter by Type (exact match - safe for enum)
    if (filters.type) {
      conditions += ` AND s.type::text = $${idx++}`; // ::text for safety if enum
      params.push(filters.type);
    }

    // 🔹 Pagination
    let pagination = '';
    if (page && limit) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    // 🔹 Main Data Query
   const query = `
SELECT 
    s.id,
    s.branch_id,
    b.branch_name,
    s.class_id,
    c.class_name,
    s.master_subject_id,
    ms.subject_name AS master_subject_name,
    s.code,
    s.type::text AS type
FROM subjects s
LEFT JOIN classes c
    ON c.class_id = s.class_id
LEFT JOIN branches b
    ON b.branch_id = s.branch_id
LEFT JOIN master_subjects ms
    ON ms.id = s.master_subject_id
${conditions}
ORDER BY s.id DESC
${pagination}
`;

const data = await this.dataSource.query(query, params);
    // 🔹 Count Query - reuse params without pagination parts
    const countParams = params.slice(
  0,
  params.length - (page && limit ? 2 : 0),
);

const countQuery = `
SELECT COUNT(*) AS count
FROM subjects s
LEFT JOIN classes c
    ON c.class_id = s.class_id
LEFT JOIN branches b
    ON b.branch_id = s.branch_id
LEFT JOIN master_subjects ms
    ON ms.id = s.master_subject_id
${conditions}
`;

const totalRecordsResult = await this.dataSource.query(
  countQuery,
  countParams,
);

const totalRecords = Number(totalRecordsResult[0].count);
    return {
      status: true,
      message: 'Filtered subjects fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async getAssignSubjectTeachers(page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = 'WHERE ts.status = 1';
    let idx = 1;

    let pagination = '';
    if (page && limit) {
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, (page - 1) * limit);
    }

    const query = `
      SELECT 
        ts.id,
        ts.branch_id,
        b.branch_name,
        ts.class_id,
        c.class_name,
        ts.teacher_id,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
        ts.subject_id,
        ms.subject_name
      FROM teacher_subjects_allocation ts
      INNER JOIN teachers t ON t.teacher_id = ts.teacher_id
      INNER JOIN subjects s ON s.id = ts.subject_id
      LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
      INNER JOIN classes c ON c.class_id = ts.class_id
      INNER JOIN branches b ON b.branch_id = ts.branch_id
      ${conditions}
      ORDER BY ts.id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    // 🔹 Count Query - reuse params without pagination parts
    const countParams = params.slice(
      0,
      params.length - (page && limit ? 2 : 0),
    );

    const countQuery = `
    SELECT COUNT(*) AS count
    FROM teacher_subjects_allocation ts
    INNER JOIN teachers t ON t.teacher_id = ts.teacher_id
    INNER JOIN branches b ON b.branch_id = ts.branch_id
    INNER JOIN subjects s ON s.id = ts.subject_id
    LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
    INNER JOIN classes c ON c.class_id = ts.class_id
    ${conditions}
  `;

    const totalRecordsResult = await this.dataSource.query(
      countQuery,
      countParams,
    );
    const totalRecords = Number(totalRecordsResult[0].count);

    return {
      status: true,
      message: 'Teacher subject assignments fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async updateAssignTeacherSubject(id: number, @Body() body: AssignTeacherSubjectDto) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT id FROM teacher_subjects_allocation 
     WHERE id = $1 LIMIT 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new BadRequestException(
        'Assignment not found',
      );
    }

    await this.dataSource.query(
      `UPDATE teacher_subjects_allocation 
       SET teacher_id = $1, subject_id = $2, class_id = $3, branch_id = $4
       WHERE id = $5`,
      [body.teacher_id, body.subject_id, body.class_id, body.branch_id, id],
    );

    return {
      status: true,
      message: 'Assign Teacher updated successfully',
    };
  }

  async getAssignTeacherById(id: number) {
    if (!id) {
      throw new BadRequestException('assignment id is required');
    }
    const query = `
      SELECT 
        ts.id,
        ts.branch_id,
        b.branch_name,
        ts.class_id,
        c.class_name,
        ts.teacher_id,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
        ts.subject_id,
        ms.id as master_subject_id,
        ms.subject_name
      FROM teacher_subjects_allocation ts
      INNER JOIN teachers t ON t.teacher_id = ts.teacher_id
      INNER JOIN subjects s ON s.id = ts.subject_id
      LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
      INNER JOIN classes c ON c.class_id = ts.class_id
      INNER JOIN branches b ON b.branch_id = ts.branch_id
      WHERE ts.id = $1 AND ts.status = 1
    `;
    const result = await this.dataSource.query(query, [id]);
    return {
      status: true,
      message:
        result.length > 0
          ? 'Teacher Assignment By Id fetched successfully'
          : 'Teacher Assignment By Id not found',
      data: result[0] || null,
    };
  }

  async deleteAssignTeacher(id: number) {
    if (!id) {
      throw new BadRequestException('assignment id is required');
    }
    await this.dataSource.query(
      `UPDATE teacher_subjects_allocation SET status = 0, updated_at = NOW() WHERE id = $1`,
      [id],
    );
    return {
      status: true,
      message: 'Assign Teacher By Id deleted successfully',
    };
  }

  async searchAssignTeacher(keyword: string, page?: number, limit?: number) {
    const params: any[] = [`%${keyword}%`];
    let pagination = '';
    if (page && limit) {
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, (Number(page) - 1) * Number(limit));
    }

    const query = `
      SELECT 
        ts.id,
        ts.branch_id,
        b.branch_name,
        ts.class_id,
        c.class_name,
        ts.teacher_id,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
        ts.subject_id,
        ms.subject_name
      FROM teacher_subjects_allocation ts
      INNER JOIN teachers t ON t.teacher_id = ts.teacher_id
      INNER JOIN subjects s ON s.id = ts.subject_id
      LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
      INNER JOIN classes c ON c.class_id = ts.class_id
      INNER JOIN branches b ON b.branch_id = ts.branch_id
      WHERE ts.status = 1 AND (
        b.branch_name ILIKE $1 OR
        c.class_name ILIKE $1 OR
        CONCAT(t.first_name, ' ', t.last_name) ILIKE $1
      )
      ORDER BY ts.id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);
    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM teacher_subjects_allocation ts 
       INNER JOIN teachers t ON t.teacher_id = ts.teacher_id
       INNER JOIN classes c ON c.class_id = ts.class_id
       INNER JOIN branches b ON b.branch_id = ts.branch_id
       WHERE ts.status = 1 AND (
         b.branch_name ILIKE $1 OR
         c.class_name ILIKE $1 OR
         CONCAT(t.first_name, ' ', t.last_name) ILIKE $1
       )`,
      [`%${keyword}%`],
    );

    const totalRecords = parseInt(totalResult[0]?.count || '0', 10);

    return {
      status: true,
      message: 'Search Teacher Assignments fetched successfully',
      data,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterAssignTeacher(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = 'WHERE ts.status = 1';
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name ILIKE $${idx++}`;
      params.push(`%${filters.branch_name}%`);
    }
    if (filters.class_name) {
      conditions += ` AND c.class_name ILIKE $${idx++}`;
      params.push(`%${filters.class_name}%`);
    }
    if (filters.teacher_name) {
      conditions += ` AND (CONCAT(t.first_name, ' ', t.last_name) ILIKE $${idx++})`;
      params.push(`%${filters.teacher_name}%`);
    }
    if (filters.subject_name) {
      conditions += ` AND ms.subject_name ILIKE $${idx++}`;
      params.push(`%${filters.subject_name}%`);
    }

    let pagination = '';
    if (page && limit) {
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, (Number(page) - 1) * Number(limit));
    }

    const query = `
      SELECT 
        ts.id,
        ts.branch_id,
        b.branch_name,
        ts.class_id,
        c.class_name,
        ts.teacher_id,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
        ts.subject_id,
        ms.subject_name
      FROM teacher_subjects_allocation ts
      INNER JOIN teachers t ON t.teacher_id = ts.teacher_id
      INNER JOIN subjects s ON s.id = ts.subject_id
      LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
      INNER JOIN classes c ON c.class_id = ts.class_id
      INNER JOIN branches b ON b.branch_id = ts.branch_id
      ${conditions}
      ORDER BY ts.id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);
    const countParams = params.slice(
      0,
      page && limit ? params.length - 2 : params.length,
    );
    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM teacher_subjects_allocation ts 
       INNER JOIN teachers t ON t.teacher_id = ts.teacher_id
       INNER JOIN classes c ON c.class_id = ts.class_id
       INNER JOIN branches b ON b.branch_id = ts.branch_id
       INNER JOIN subjects s ON s.id = ts.subject_id
       LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
       ${conditions}`,
      countParams,
    );

    const totalRecords = totalResult[0]?.count ?? 0;

    return {
      status: true,
      message: 'Filter Teacher Assignments fetched successfully',
      data,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }
}

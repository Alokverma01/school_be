import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CloudinaryService } from '../common/services/cloudinary.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  CreateSubmissionDto,
  UpdateSubmissionDto,
} from './dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  // ---------- Assignments ----------

  async createAssignment(dto: CreateAssignmentDto, file?: Express.Multer.File) {
    const now = new Date();

    if (!file && !dto.file_url) {
      throw new BadRequestException('Assignment file is required');
    }

    let fileUrl: string | null = dto.file_url || null;

    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        fileUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw new BadRequestException('Failed to upload assignment to Cloudinary');
      }
    }

    const query = `
      INSERT INTO assignments 
      (branch_id ,class_id, section_id, subject_id, teacher_id, title, instructions, file_url, due_date, status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,$10,$11)
      RETURNING *
    `;
    const values = [
      dto.branch_id,
      dto.class_id,
      dto.section_id,
      dto.subject_id,
      dto.teacher_id,
      dto.title,
      dto.instructions ?? null,
      fileUrl,
      dto.due_date,
      now,
      now,
    ];

    await this.dataSource.query(query, values);

    return {
      status: true,
      message: 'Assignment created successfully',
    };
  }

  async getAssignments(page?: number, limit?: number) {
    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const offset = (currentPage - 1) * pageSize;

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM assignments WHERE status = 1`,
    );
    const totalRecords = parseInt(totalResult[0].count, 10);

    const query = `
      SELECT assignment_id, a.branch_id, a.class_id , a.section_id , a.subject_id , a.teacher_id ,
       CONCAT(t.first_name , ' ' , last_name) as teacher_name,
       b.branch_name,
       c.class_name,
       sec.section_name,
       ms.subject_name as subject,
       a.title , a.instructions , a.file_url , a.due_date
      FROM assignments a
      LEFT JOIN classes c ON c.class_id = a.class_id
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      LEFT JOIN subjects s ON s.id = a.subject_id
      LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
      LEFT JOIN sections sec ON sec.section_id = a.section_id
      LEFT JOIN teachers t ON t.teacher_id = a.teacher_id
      WHERE a.status = 1
      ORDER BY assignment_id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    const data = await this.dataSource.query(query);

    return {
      status: true,
      message: 'Assignments fetched successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
    };
  }

  async getAssignmentById(id: number) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    const query = `
    SELECT 
      a.assignment_id, 
      a.branch_id, 
      a.class_id, 
      a.section_id,
      a.subject_id, 
      a.teacher_id, 
      a.title, 
      a.instructions, 
      a.file_url, 
      a.due_date,
      ms.id as master_subject_id
    FROM assignments a
    LEFT JOIN classes c ON c.class_id = a.class_id
    LEFT JOIN branches b ON b.branch_id = a.branch_id
    LEFT JOIN subjects s ON s.id = a.subject_id
    LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
    LEFT JOIN sections sec ON sec.section_id = a.section_id
    LEFT JOIN teachers t ON t.teacher_id = a.teacher_id
    WHERE a.assignment_id = $1 AND a.status = 1
  `;

    const result = await this.dataSource.query(query, [id]);

    if (result.length === 0) {
      throw new NotFoundException('Assignment not found');
    }

    return {
      status: true,
      message: 'Assignment fetched successfully',
      data: result[0],
    };
  }

  async getAssignmentsByBranchClassAndSection(branchId: number, classId: number, sectionId: number) {
    if (!branchId || !classId || !sectionId) {
      throw new BadRequestException(
        'Both branch_id, class_id and section_id are required',
      );
    }

    const query = `
    SELECT 
      assignment_id,
      title
    FROM assignments
    WHERE branch_id = $1
      AND class_id = $2
      AND section_id = $3
      AND status = 1
    ORDER BY due_date ASC
  `;

    const result = await this.dataSource.query(query, [branchId, classId, sectionId]);

    return {
      status: true,
      message:
        result.length > 0
          ? 'Assignments fetched successfully'
          : 'No assignments found for this class and section',
      data: result,
    };
  }

  async updateAssignment(assignment_id: number, dto: UpdateAssignmentDto, file?: Express.Multer.File) {
    if (!assignment_id) {
      throw new BadRequestException('assignment_id is required');
    }

    const existing = await this.dataSource.query(
      `SELECT file_url FROM assignments WHERE assignment_id = $1 AND status = 1`,
      [assignment_id],
    );

    if (existing.length === 0) {
      throw new NotFoundException('Assignment not found');
    }

    let fileUrl: string | null = (dto as any).file_url || existing[0].file_url;

    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        fileUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw new BadRequestException('Failed to upload assignment to Cloudinary');
      }
    }

    await this.dataSource.query(
      `
    UPDATE assignments
    SET
      branch_id = $1,
      class_id = $2,
      section_id = $3,
      subject_id = $4,
      teacher_id = $5,
      title = $6,
      instructions = $7,
      file_url = $8,
      due_date = $9,
      updated_at = NOW()
     WHERE assignment_id = $10 AND status = 1
    `,
      [
        dto.branch_id,
        dto.class_id,
        dto.section_id,
        dto.subject_id,
        dto.teacher_id,
        dto.title,
        dto.instructions,
        fileUrl,
        dto.due_date,
        assignment_id,
      ],
    );

    return {
      status: true,
      message: 'Assignment updated successfully',
    };
  }

  async deleteAssignment(assignment_id: number) {
    if (!assignment_id) {
      throw new BadRequestException('assignment_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT assignment_id FROM assignments WHERE assignment_id = $1 AND status = 1`,
      [assignment_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Assignment not found');
    }

    const query = `
      UPDATE assignments
      SET status = 0, updated_at = $1
      WHERE assignment_id = $2 AND status = 1
      RETURNING *
    `;
    const result = await this.dataSource.query(query, [
      new Date(),
      assignment_id,
    ]);
    if (!result.length) throw new NotFoundException('Assignment not found');

    return {
      status: true,
      message: 'Assignment deleted successfully',
    };
  }

  async searchAssignments(keyword: string, page?: number, limit?: number) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];
    const pageSize = limit && limit > 0 ? limit : 10;
    const currentPage = page && page > 0 ? page : 1;
    const offset = (currentPage - 1) * pageSize;

    let pagination = '';
    if (page && limit) {
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(pageSize, offset);
    }

    const query = `
    SELECT 
      a.assignment_id,
      a.class_id,
      a.branch_id,
      b.branch_name,
      a.section_id,
      a.subject_id,
      a.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      b.branch_name,
      c.class_name,
      sec.section_name,
      ms.subject_name AS subject,
      a.title,
      a.instructions,
      a.file_url,
      a.due_date
    FROM assignments a
    LEFT JOIN classes c ON c.class_id = a.class_id
    LEFT JOIN branches b ON b.branch_id = a.branch_id
    LEFT JOIN subjects s ON s.id = a.subject_id
    LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
    LEFT JOIN sections sec ON sec.section_id = a.section_id
    LEFT JOIN teachers t ON t.teacher_id = a.teacher_id
    WHERE a.status = 1
      AND (
        a.title ILIKE $1
        OR a.instructions ILIKE $1
        OR b.branch_name ILIKE $1
        OR CONCAT(t.first_name, ' ', t.last_name) ILIKE $1
        OR c.class_name ILIKE $1
        OR sec.section_name ILIKE $1
        OR ms.subject_name ILIKE $1
      )
    ORDER BY a.assignment_id DESC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
    SELECT COUNT(*)
    FROM assignments a
    LEFT JOIN classes c ON c.class_id = a.class_id
    LEFT JOIN branches b ON b.branch_id = a.branch_id
    LEFT JOIN subjects s ON s.id = a.subject_id
    LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
    LEFT JOIN sections sec ON sec.section_id = a.section_id
    LEFT JOIN teachers t ON t.teacher_id = a.teacher_id
    WHERE a.status = 1
      AND (
        a.title ILIKE $1
        OR a.instructions ILIKE $1
        OR b.branch_name ILIKE $1
        OR CONCAT(t.first_name, ' ', t.last_name) ILIKE $1
        OR c.class_name ILIKE $1
        OR sec.section_name ILIKE $1
        OR ms.subject_name ILIKE $1
      )
  `;


    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Assignment search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / pageSize) : 1,
    };
  }

  async filterAssignments(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE a.status = 1`;
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

    if (filters.subject_name) {
      conditions += ` AND ms.subject_name= $${idx++}`;
      params.push(filters.subject_name);
    }

    if (filters.teacher_id) {
      conditions += ` AND a.teacher_id = $${idx++}`;
      params.push(filters.teacher_id);
    }

    if (filters.due_date_from) {
      conditions += ` AND a.due_date >= $${idx++}`;
      params.push(filters.due_date_from);
    }

    if (filters.due_date_to) {
      conditions += ` AND a.due_date <= $${idx++}`;
      params.push(filters.due_date_to);
    }

    const pageSize = limit && limit > 0 ? limit : 10;
    const currentPage = page && page > 0 ? page : 1;

    let baseQuery = `
    SELECT 
      a.assignment_id,
      a.class_id,
      a.section_id,
      a.subject_id,
      a.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      c.class_name,
      b.branch_name,
      sec.section_name,
      ms.subject_name AS subject,
      a.title,
      a.instructions,
      a.file_url,
      a.due_date
    FROM assignments a
    LEFT JOIN classes c ON c.class_id = a.class_id
    LEFT JOIN branches b ON b.branch_id = a.branch_id
    LEFT JOIN subjects s ON s.id = a.subject_id
    LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
    LEFT JOIN sections sec ON sec.section_id = a.section_id
    LEFT JOIN teachers t ON t.teacher_id = a.teacher_id
    ${conditions}
    ORDER BY a.assignment_id DESC
  `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Assignments filtered successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (currentPage - 1) * pageSize;
    baseQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(pageSize, offset);

    const data = await this.dataSource.query(baseQuery, params);

    const countQuery = `
    SELECT COUNT(*)
    FROM assignments a
    LEFT JOIN classes c ON c.class_id = a.class_id
    LEFT JOIN branches b ON b.branch_id = a.branch_id
    LEFT JOIN subjects s ON s.id = a.subject_id
    LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
    LEFT JOIN sections sec ON sec.section_id = a.section_id
    ${conditions}
  `;
    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Assignments filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
    };
  }

  //   {
  //   "class_id": 5,
  //   "subject_id": 3,
  //   "due_date_from": "2025-12-01",
  //   "due_date_to": "2025-12-31"
  // }
  // ---------- Assignment Submissions ----------

  async createSubmission(dto: CreateSubmissionDto, file?: Express.Multer.File) {
    if (!file && !dto.file_url) {
      throw new BadRequestException('Submission file is required');
    }

    let fileUrl: string | null = dto.file_url || null;

    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        fileUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw new BadRequestException('Failed to upload submission to Cloudinary');
      }
    }

    const query = `
    INSERT INTO assignment_submissions
    (assignment_id, student_id, branch_id, class_id, section_id, marks, remarks, file_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;

    const values = [
      dto.assignment_id,
      dto.student_id,
      dto.branch_id,
      dto.class_id,
      dto.section_id,
      dto.marks,
      dto.remarks ?? null,
      fileUrl,
    ];

    try {
      await this.dataSource.query(query, values);
      return {
        status: true,
        message: 'Submission created successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to create submission. Check if assignment and student belong to the selected branch/class/section.',
      );
    }
  }

  async getSubmissions(page?: number, limit?: number) {
    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const offset = (currentPage - 1) * pageSize;

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM assignment_submissions WHERE status = 1`,
    );
    const totalRecords = parseInt(totalResult[0].count, 10);

    const query = `
      SELECT
        sub.submission_id,
        sub.assignment_id,
        a.title AS assignment_title,
        sub.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        sub.branch_id,
        b.branch_name,
        sub.class_id,
        c.class_name,
        sub.section_id,
        sec.section_name,
        sub.marks,
        sub.remarks,
        sub.file_url
      FROM assignment_submissions sub
      LEFT JOIN students s ON s.student_id = sub.student_id
      LEFT JOIN assignments a ON a.assignment_id = sub.assignment_id
      LEFT JOIN branches b ON b.branch_id = sub.branch_id
      LEFT JOIN classes c ON c.class_id = sub.class_id
      LEFT JOIN sections sec ON sec.section_id = sub.section_id
      WHERE sub.status = 1
      ORDER BY sub.submission_id DESC
      LIMIT $1 OFFSET $2
    `;

    const data = await this.dataSource.query(query, [pageSize, offset]);

    return {
      status: true,
      message: 'Submissions fetched successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
    };
  }

  async getSubmissionById(submission_id: number) {
    if (!submission_id) {
      throw new BadRequestException('submission_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT submission_id FROM assignment_submissions WHERE submission_id = $1 AND status = 1`,
      [submission_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Submission not found');
    }

    const query = `
    SELECT
      sub.submission_id,
      sub.assignment_id,
      sub.student_id,
      sub.branch_id,
      sub.class_id,
      sub.section_id,
      sub.marks,
      sub.remarks,
      sub.file_url
    FROM assignment_submissions sub
    WHERE sub.submission_id = $1 AND sub.status = 1
  `;

    const result = await this.dataSource.query(query, [submission_id]);

    return {
      status: true,
      message: 'Submission fetched successfully',
      data: result[0],
    };
  }

  async updateSubmission(submission_id: number, dto: UpdateSubmissionDto, file?: Express.Multer.File) {
    if (!submission_id) {
      throw new BadRequestException('submission_id is required');
    }

    const existing = await this.dataSource.query(
      `SELECT file_url FROM assignment_submissions WHERE submission_id = $1 AND status = 1`,
      [submission_id],
    );

    if (existing.length === 0) {
      throw new NotFoundException('Submission not found');
    }

    let fileUrl: string | null = dto.file_url || existing[0].file_url;

    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        fileUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw new BadRequestException('Failed to upload submission to Cloudinary');
      }
    }

    await this.dataSource.query(
      `
    UPDATE assignment_submissions
    SET
      marks = $1,
      remarks = $2,
      file_url = $3,
      updated_at = NOW()
    WHERE submission_id = $4
    `,
      [
        dto.marks,
        dto.remarks,
        fileUrl,
        submission_id,
      ],
    );

    return {
      status: true,
      message: 'Submission updated successfully',
    };
  }

  async deleteSubmission(submission_id: number) {
    if (!submission_id) {
      throw new BadRequestException('submission_id is required');
    }

    const exists = await this.dataSource.query(
      `
    SELECT submission_id 
    FROM assignment_submissions 
    WHERE submission_id = $1 AND status = 1
    `,
      [submission_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Submission not found');
    }
    const query = `
      UPDATE assignment_submissions
      SET status = 0, updated_at = $1
      WHERE submission_id = $2 AND status = 1
      RETURNING *
    `;
    const result = await this.dataSource.query(query, [
      new Date(),
      submission_id,
    ]);
    if (!result.length) throw new NotFoundException('Submission not found');

    return {
      status: true,
      message: 'Submission deleted successfully',
    };
  }

  async searchSubmissions(keyword: string, page?: number, limit?: number) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];
    const pageSize = limit && limit > 0 ? limit : 10;
    const currentPage = page && page > 0 ? page : 1;
    const offset = (currentPage - 1) * pageSize;

    let pagination = '';
    if (page && limit) {
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(pageSize, offset);
    }

    const query = `
      SELECT
        sub.submission_id,
        sub.assignment_id,
        a.title AS assignment_title,
        sub.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        sub.branch_id,
        b.branch_name,
        sub.class_id,
        c.class_name,
        sub.section_id,
        sec.section_name,
        sub.marks,
        sub.remarks,
        sub.file_url
      FROM assignment_submissions sub
      LEFT JOIN students s ON s.student_id = sub.student_id
      LEFT JOIN assignments a ON a.assignment_id = sub.assignment_id
      LEFT JOIN branches b ON b.branch_id = sub.branch_id
      LEFT JOIN classes c ON c.class_id = sub.class_id
      LEFT JOIN sections sec ON sec.section_id = sub.section_id
      WHERE sub.status = 1
        AND (
          a.title ILIKE $1
          OR CONCAT(s.first_name, ' ', s.last_name) ILIKE $1
          OR b.branch_name ILIKE $1
          OR c.class_name ILIKE $1
          OR sec.section_name ILIKE $1
          OR sub.remarks ILIKE $1
        )
      ORDER BY sub.submission_id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM assignment_submissions sub
      LEFT JOIN students s ON s.student_id = sub.student_id
      LEFT JOIN assignments a ON a.assignment_id = sub.assignment_id
      LEFT JOIN branches b ON b.branch_id = sub.branch_id
      LEFT JOIN classes c ON c.class_id = sub.class_id
      LEFT JOIN sections sec ON sec.section_id = sub.section_id
      WHERE sub.status = 1
        AND (
          a.title ILIKE $1
          OR CONCAT(s.first_name, ' ', s.last_name) ILIKE $1
          OR b.branch_name ILIKE $1
          OR c.class_name ILIKE $1
          OR sec.section_name ILIKE $1
          OR sub.remarks ILIKE $1
        )
    `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Submission search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / pageSize) : 1,
    };
  }

  async filterSubmissions(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE sub.status = 1`;
    let idx = 1;

    // Text filters (case-insensitive partial match)
    if (filters.branch_name?.trim()) {
      conditions += ` AND b.branch_name ILIKE $${idx++}`;
      params.push(`%${filters.branch_name.trim()}%`);
    }

    if (filters.class_name?.trim()) {
      conditions += ` AND c.class_name ILIKE $${idx++}`;
      params.push(`%${filters.class_name.trim()}%`);
    }

    if (filters.section_name?.trim()) {
      conditions += ` AND sec.section_name ILIKE $${idx++}`;
      params.push(`%${filters.section_name.trim()}%`);
    }

    if (filters.subject_name?.trim()) {
      conditions += ` AND ms.subject_name ILIKE $${idx++}`;
      params.push(`%${filters.subject_name.trim()}%`);
    }

    if (filters.student_name?.trim()) {
      conditions += ` AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $${idx++}`;
      params.push(`%${filters.student_name.trim()}%`);
    }

    if (filters.assignment_title?.trim()) {
      conditions += ` AND a.title ILIKE $${idx++}`;
      params.push(`%${filters.assignment_title.trim()}%`);
    }

    // Marks range
    if (
      filters.min_marks !== undefined &&
      filters.min_marks !== null &&
      filters.min_marks !== ''
    ) {
      conditions += ` AND sub.marks >= $${idx++}`;
      params.push(Number(filters.min_marks));
    }

    if (
      filters.max_marks !== undefined &&
      filters.max_marks !== null &&
      filters.max_marks !== ''
    ) {
      conditions += ` AND sub.marks <= $${idx++}`;
      params.push(Number(filters.max_marks));
    }

    const pageSize = limit && limit > 0 ? limit : 10;
    const currentPage = page && page > 0 ? page : 1;

    const baseQuery = `
    SELECT 
      sub.submission_id,
      sub.assignment_id,
      a.title AS assignment_title,
      sub.student_id,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      sub.branch_id,
      b.branch_name,
      sub.class_id,
      c.class_name,
      sub.section_id,
      sec.section_name,
      ms.subject_name as subject,
      sub.marks,
      sub.remarks
    FROM assignment_submissions sub
    LEFT JOIN students s ON s.student_id = sub.student_id
    LEFT JOIN assignments a ON a.assignment_id = sub.assignment_id
    LEFT JOIN branches b ON b.branch_id = sub.branch_id
    LEFT JOIN classes c ON c.class_id = sub.class_id
    LEFT JOIN sections sec ON sec.section_id = sub.section_id
    LEFT JOIN subjects subj ON subj.id = a.subject_id
    LEFT JOIN master_subjects ms ON ms.id = subj.master_subject_id
    ${conditions}
    ORDER BY sub.submission_id DESC
  `;

    // If no pagination → return all
    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Submissions filtered successfully',
        data,
        totalRecords: data.length,
      };
    }

    // With pagination
    const offset = (currentPage - 1) * pageSize;
    const paginatedQuery = baseQuery + ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(pageSize, offset);

    const data = await this.dataSource.query(paginatedQuery, params);

    // Count total for pagination
    const countQuery = `
    SELECT COUNT(*) 
    FROM assignment_submissions sub
    LEFT JOIN assignments a ON a.assignment_id = sub.assignment_id
    LEFT JOIN students s ON s.student_id = sub.student_id
    LEFT JOIN branches b ON b.branch_id = sub.branch_id
    LEFT JOIN classes c ON c.class_id = sub.class_id
    LEFT JOIN sections sec ON sec.section_id = sub.section_id
    LEFT JOIN subjects s ON s.id = a.subject_id
    LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
    ${conditions}
  `;

    const countParams = params.slice(0, params.length - 2); // remove limit & offset
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Submissions filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
    };
  }
}

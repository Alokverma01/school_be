
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CloudinaryService } from '../common/services/cloudinary.service';

@Injectable()
export class CertificateService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  // CREATE
  async create(dto: any, file?: Express.Multer.File) {
    const now = new Date();

    // if (!file && !dto.file_url) {
    //   throw new BadRequestException('Certificate file is required');
    // }

    let fileUrl: string | null = dto.file_url || null;

    // if (file) {
    //   try {
    //     console.log('Starting upload for:', file.originalname);
    //     const uploadResult = await this.cloudinaryService.uploadFile(file);
    //     console.log('Upload success:', uploadResult.secure_url);
    //     fileUrl = uploadResult.secure_url;
    //   } catch (error) { 
    //     console.error('Cloudinary upload failed:', error);
    //     throw new BadRequestException('Failed to upload certificate to Cloudinary');
    //   }
    // }

    // if (!fileUrl) {
    //   throw new BadRequestException('Certificate file URL is required');
    // }

    const query = `
      INSERT INTO certificates
      (branch_id, issued_to, class_id, section_id, user_id, certificate_type_id, notes, issue_date, uploaded_by, file_url, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, $11, $11)
    `;

    const values = [
      dto.branch_id,
      dto.issued_to,
      dto.issued_to === 'student' ? dto.class_id : null,
      dto.issued_to === 'student' ? dto.section_id : null,
      dto.user_id,
      dto.certificate_type_id,
      dto.notes || null,
      dto.issue_date || now,
      dto.uploaded_by,
      fileUrl,
      now,
    ];

    try {
      await this.dataSource.query(query, values);
      return { status: true, message: 'Certificate created successfully' };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to create certificate');
    }
  }

  // UPDATE
  async update(id: number, dto: any, file?: Express.Multer.File) {
    if (!id) throw new BadRequestException('certificate_id is required');

    const existing = await this.dataSource.query(
      `SELECT file_url FROM certificates WHERE certificate_id = $1 AND status = 1`,
      [id],
    );

    if (existing.length === 0) {
      throw new NotFoundException('Certificate not found');
    }

    let fileUrl: string | null = existing[0].file_url;

    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        fileUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw new BadRequestException('File upload failed');
      }
    }

    const query = `
      UPDATE certificates
      SET
        branch_id = $1,
        issued_to = $2,
        class_id = $3,
        section_id = $4,
        user_id = $5,
        certificate_type_id = $6,
        notes = $7,
        issue_date = $8,
        uploaded_by = $9,
        file_url = $10,
        updated_at = NOW()
      WHERE certificate_id = $11
    `;

    const values = [
      dto.branch_id,
      dto.issued_to,
      dto.issued_to === 'student' ? dto.class_id : null,
      dto.issued_to === 'student' ? dto.section_id : null,
      dto.user_id,
      dto.certificate_type_id,
      dto.notes || null,
      dto.issue_date,
      dto.uploaded_by,
      fileUrl,
      id,
    ];

    await this.dataSource.query(query, values);

    return { status: true, message: 'Certificate updated successfully' };
  }

  // GET ALL (WITH PAGINATION)
  async getAll(page?: number, limit?: number) {
    let baseQuery = `
      SELECT 
        c.certificate_id,
        c.branch_id,
        br.branch_name,
        c.issued_to,
        c.user_id,
        c.class_id,
        cl.class_name,
        c.section_id,
        sec.section_name,
        ct.certificate_name,
        c.notes,
        c.issue_date,
        c.uploaded_by,
        c.file_url,
        CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name,

        CASE 
          WHEN c.issued_to = 'teacher'
            THEN CONCAT(t.first_name, ' ', t.last_name)
          WHEN c.issued_to = 'student'
            THEN CONCAT(s.first_name, ' ', s.last_name)
          ELSE 'Unknown'
        END AS user_name
      FROM certificates c
      LEFT JOIN branches br ON br.branch_id = c.branch_id
      LEFT JOIN certificate_types ct ON ct.certificate_type_id = c.certificate_type_id
      LEFT JOIN classes cl ON cl.class_id = c.class_id
      LEFT JOIN sections sec ON sec.section_id = c.section_id
      LEFT JOIN teachers t 
        ON t.teacher_id = c.user_id AND c.issued_to = 'teacher'
      LEFT JOIN students s 
        ON s.student_id = c.user_id AND c.issued_to = 'student'
      LEFT JOIN users u ON u.user_id = c.uploaded_by
      WHERE c.status = 1
      ORDER BY c.certificate_id DESC
    `;

    const params: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(baseQuery, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM certificates WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Certificates fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // GET BY ID
  async getById(id: number) {
    if (!id) throw new BadRequestException('certificate_id is required');

    const query = `
      SELECT 
        c.certificate_id,
        c.branch_id,
        br.branch_name,
        c.issued_to,
        c.user_id,
        c.class_id,
        cl.class_name,
        c.section_id,
        sec.section_name,
        ct.certificate_name,
        c.notes,
        c.issue_date,
        c.uploaded_by,
        c.file_url,
        CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name,

        CASE 
          WHEN c.issued_to = 'teacher'
            THEN CONCAT(t.first_name, ' ', t.last_name)
          WHEN c.issued_to = 'student'
            THEN CONCAT(s.first_name, ' ', s.last_name)
          ELSE 'Unknown'
        END AS user_name
      FROM certificates c
      LEFT JOIN branches br ON br.branch_id = c.branch_id
      LEFT JOIN certificate_types ct ON ct.certificate_type_id = c.certificate_type_id
      LEFT JOIN classes cl ON cl.class_id = c.class_id
      LEFT JOIN sections sec ON sec.section_id = c.section_id
      LEFT JOIN teachers t 
        ON t.teacher_id = c.user_id AND c.issued_to = 'teacher'
      LEFT JOIN students s 
        ON s.student_id = c.user_id AND c.issued_to = 'student'
      LEFT JOIN users u ON u.user_id = c.uploaded_by
      WHERE c.certificate_id = $1 AND c.status = 1
    `;

    const result = await this.dataSource.query(query, [id]);

    if (result.length === 0) {
      throw new NotFoundException('Certificate not found');
    }

    return {
      status: true,
      message: 'Certificate fetched successfully',
      data: result[0],
    };
  }

  // SOFT DELETE
  async delete(id: number) {
    if (!id) throw new BadRequestException('certificate_id is required');

    const exists = await this.dataSource.query(
      `SELECT certificate_id FROM certificates WHERE certificate_id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Certificate not found');
    }

    await this.dataSource.query(
      `UPDATE certificates SET status = 0, updated_at = NOW() WHERE certificate_id = $1`,
      [id],
    );

    return { status: true, message: 'Certificate deleted successfully' };
  }

  // SEARCH
  async searchCertificates(keyword: string, page?: number, limit?: number) {
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
        c.certificate_id,
        c.branch_id,
        br.branch_name,
        c.issued_to,
        c.user_id,
        c.class_id,
        cl.class_name,
        c.section_id,
        sec.section_name,
        ct.certificate_name,
        c.notes,
        c.issue_date,
        c.uploaded_by,
        c.file_url,
        CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name,

        CASE 
          WHEN c.issued_to = 'teacher'
            THEN CONCAT(t.first_name, ' ', t.last_name)
          WHEN c.issued_to = 'student'
            THEN CONCAT(s.first_name, ' ', s.last_name)
          ELSE 'Unknown'
        END AS user_name
      FROM certificates c
      LEFT JOIN branches br ON br.branch_id = c.branch_id
      LEFT JOIN certificate_types ct ON ct.certificate_type_id = c.certificate_type_id
      LEFT JOIN classes cl ON cl.class_id = c.class_id
      LEFT JOIN sections sec ON sec.section_id = c.section_id
      LEFT JOIN teachers t 
        ON t.teacher_id = c.user_id AND c.issued_to = 'teacher'
      LEFT JOIN students s 
        ON s.student_id = c.user_id AND c.issued_to = 'student'
      LEFT JOIN users u ON u.user_id = c.uploaded_by
      WHERE c.status = 1
        AND (
          br.branch_name ILIKE $1
          OR cl.class_name ILIKE $1
          OR sec.section_name ILIKE $1
          OR ct.certificate_name ILIKE $1
          OR c.notes ILIKE $1
          OR TO_CHAR(c.issue_date, 'YYYY-MM-DD') ILIKE $1
          OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $1
          OR (c.issued_to = 'teacher' AND CONCAT(t.first_name, ' ', t.last_name) ILIKE $1)
          OR (c.issued_to = 'student' AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $1)
        )
      ORDER BY c.certificate_id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM certificates c
      LEFT JOIN branches br ON br.branch_id = c.branch_id
      LEFT JOIN certificate_types ct ON ct.certificate_type_id = c.certificate_type_id
      LEFT JOIN classes cl ON cl.class_id = c.class_id
      LEFT JOIN sections sec ON sec.section_id = c.section_id
      LEFT JOIN teachers t 
        ON t.teacher_id = c.user_id AND c.issued_to = 'teacher'
      LEFT JOIN students s 
        ON s.student_id = c.user_id AND c.issued_to = 'student'
      LEFT JOIN users u ON u.user_id = c.uploaded_by
      WHERE c.status = 1
        AND (
          br.branch_name ILIKE $1
          OR cl.class_name ILIKE $1
          OR sec.section_name ILIKE $1
          OR ct.certificate_name ILIKE $1
          OR c.notes ILIKE $1
          OR TO_CHAR(c.issue_date, 'YYYY-MM-DD') ILIKE $1
          OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $1
          OR (c.issued_to = 'teacher' AND CONCAT(t.first_name, ' ', t.last_name) ILIKE $1)
          OR (c.issued_to = 'student' AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $1)
        )
    `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Certificate search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // FILTER
  async filterCertificates(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE c.status = 1`;
    let idx = 1;

    if (filters.branch_name?.trim()) {
      conditions += ` AND br.branch_name ILIKE $${idx++}`;
      params.push(`%${filters.branch_name.trim()}%`);
    }

    if (filters.class_name?.trim()) {
      conditions += ` AND cl.class_name ILIKE $${idx++}`;
      params.push(`%${filters.class_name.trim()}%`);
    }

    if (filters.section_name?.trim()) {
      conditions += ` AND sec.section_name ILIKE $${idx++}`;
      params.push(`%${filters.section_name.trim()}%`);
    }

    if (filters.certificate_type_id) {
      conditions += ` AND c.certificate_type_id = $${idx++}`;
      params.push(filters.certificate_type_id);
    }

    if (filters.issued_to) {
      conditions += ` AND c.issued_to = $${idx++}`;
      params.push(filters.issued_to);
    }

    if (filters.uploaded_by_name?.trim()) {
      conditions += ` AND CONCAT(u.first_name, ' ', u.last_name) ILIKE $${idx++}`;
      params.push(`%${filters.uploaded_by_name.trim()}%`);
    }

    if (filters.from_date) {
      conditions += ` AND c.issue_date >= $${idx++}`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      conditions += ` AND c.issue_date <= $${idx++}`;
      params.push(filters.to_date);
    }

    const baseQuery = `
      SELECT 
        c.certificate_id,
        c.branch_id,
        br.branch_name,
        c.issued_to,
        c.user_id,
        c.class_id,
        cl.class_name,
        c.section_id,
        sec.section_name,
        ct.certificate_name,
        c.notes,
        c.issue_date,
        c.uploaded_by,
        c.file_url,
        CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name,

        CASE 
          WHEN c.issued_to = 'teacher'
            THEN CONCAT(t.first_name, ' ', t.last_name)
          WHEN c.issued_to = 'student'
            THEN CONCAT(s.first_name, ' ', s.last_name)
          ELSE 'Unknown'
        END AS user_name
      FROM certificates c
      LEFT JOIN branches br ON br.branch_id = c.branch_id
      LEFT JOIN certificate_types ct ON ct.certificate_type_id = c.certificate_type_id
      LEFT JOIN classes cl ON cl.class_id = c.class_id
      LEFT JOIN sections sec ON sec.section_id = c.section_id
      LEFT JOIN teachers t 
        ON t.teacher_id = c.user_id AND c.issued_to = 'teacher'
      LEFT JOIN students s 
        ON s.student_id = c.user_id AND c.issued_to = 'student'
      LEFT JOIN users u ON u.user_id = c.uploaded_by
      ${conditions}
      ORDER BY c.certificate_id DESC
    `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Certificates filtered successfully',
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
      FROM certificates c
      LEFT JOIN branches br ON br.branch_id = c.branch_id
      LEFT JOIN certificate_types ct ON ct.certificate_type_id = c.certificate_type_id
      LEFT JOIN classes cl ON cl.class_id = c.class_id
      LEFT JOIN sections sec ON sec.section_id = c.section_id
      LEFT JOIN users u ON u.user_id = c.uploaded_by
      ${conditions}
    `;

    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Certificates filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }
}

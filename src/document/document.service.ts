
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { DataSource } from 'typeorm';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) { } 
  async createDocument(body: any, file?: Express.Multer.File) { // Add file param
    console.log('Service file:', file ? file.originalname : 'NO FILE');
    const now = new Date();

    // if (!file && !body.file_url) {
    //   throw new BadRequestException('Document file is required');
    // }

    let fileUrl: string | null = body.file_url || null;

    if (file) {
      try {
        console.log('Starting upload for:', file.originalname);
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        console.log('Upload success:', uploadResult.secure_url);
        fileUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw new BadRequestException('Failed to upload document to Cloudinary');
      }
    }

    // if (!fileUrl) {
    //   throw new BadRequestException('Document file URL is required');
    // }

    const query = `
        INSERT INTO documents
        (branch_id, doc_user_type, class_id, section_id, user_id, doc_type_id, title, notes, issue_date, uploaded_by, file_url, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, $12, $12)
      `;

    const values = [
      body.branch_id,
      body.doc_user_type,
      body.doc_user_type === 'student' ? body.class_id : null,
      body.doc_user_type === 'student' ? body.section_id : null,
      body.user_id,
      body.doc_type_id,
      body.title,
      //body.notes || null,
      body.notes ?? '',
      body.issue_date || now,
      body.uploaded_by,
      fileUrl,
      now,
    ];

    try {
      await this.dataSource.query(query, values);
      return {
        status: true,
        message: 'Document uploaded successfully',
      };
    } catch (error) {
        console.error('Document Insert Error:', error);
      console.error(error);
      throw new BadRequestException('Failed to save document');
    }
  }

  // UPDATE
  async updateDocument(document_id: number, body: any, file?: Express.Multer.File) {
    if (!document_id) {
      throw new BadRequestException('document_id is required');
    }

    //Check document exists & get old file_url
    const existing = await this.dataSource.query(
      `SELECT file_url FROM documents WHERE document_id = $1 AND status = 1`,
      [document_id],
    );

    if (existing.length === 0) {
      throw new NotFoundException('Document not found');
    }

    let fileUrl: string | null = existing[0].file_url;

    // Upload new file if provided
    if (file) {
      try {
        console.log('Updating file:', file.originalname);
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        fileUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw new BadRequestException('File upload failed');
      }
    }

    //Update query
    const query = `
      UPDATE documents
      SET
        branch_id = $1,
        doc_user_type = $2,
        class_id = $3,
        section_id = $4,
        user_id = $5,
        doc_type_id = $6,
        title = $7,
        notes = $8,
        issue_date = $9,
        uploaded_by = $10,
        file_url = $11,
        updated_at = NOW()
      WHERE document_id = $12
    `;

    const values = [
      body.branch_id,
      body.doc_user_type,
      body.doc_user_type === 'student' ? body.class_id : null,
      body.doc_user_type === 'student' ? body.section_id : null,
      body.user_id,
      body.doc_type_id,
      body.title,
      body.notes || null,
      body.issue_date,
      body.uploaded_by,
      fileUrl,
      document_id,
    ];
    await this.dataSource.query(query, values);
    return {
      status: true,
      message: 'Document updated successfully',
    };
  }


  // GET ALL (WITH PAGINATION)
  async getAllDocuments(page?: number, limit?: number) {
    let baseQuery = `
      SELECT 
        d.document_id,
        br.branch_name,
        d.doc_user_type,
        c.class_name,
        sec.section_name,
        dt.document_name,
        d.title,
        d.notes,
        d.issue_date,
        d.uploaded_by,
        d.file_url,
        CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name,
        CASE 
          WHEN d.doc_user_type = 'teacher'
            THEN CONCAT(t.first_name, ' ', t.last_name)
          WHEN d.doc_user_type = 'student'
            THEN CONCAT(s.first_name, ' ', s.last_name)
          ELSE 'Unknown'
        END AS user_name
      FROM documents d
      LEFT JOIN branches br ON br.branch_id = d.branch_id
      LEFT JOIN document_types dt ON dt.document_type_id = d.doc_type_id
      LEFT JOIN classes c ON c.class_id = d.class_id
      LEFT JOIN sections sec ON sec.section_id = d.section_id
      LEFT JOIN teachers t 
        ON t.teacher_id = d.user_id AND d.doc_user_type = 'teacher'
      LEFT JOIN students s 
        ON s.student_id = d.user_id AND d.doc_user_type = 'student'
      LEFT JOIN users u ON u.user_id = d.uploaded_by
      WHERE d.status = 1
      ORDER BY d.document_id DESC
    `;

    const params: any[] = [];

    if (page && limit) {
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    }

    const documents = await this.dataSource.query(baseQuery, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM documents WHERE status = 1`,
    );
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Documents fetched successfully',
      data: documents,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // GET BY ID
  async getDocumentById(document_id: number) {
    if (!document_id) {
      throw new BadRequestException('document_id is required');
    }

    const query = `
      SELECT 
        d.document_id,
        d.branch_id,
        d.doc_user_type,
        d.user_id,
        d.class_id,
        d.section_id,
        d.doc_type_id,
        d.title,
        d.notes,
        d.issue_date,
        d.file_url as file
      FROM documents d
      WHERE d.document_id = $1 AND d.status = 1
    `;

    const result = await this.dataSource.query(query, [document_id]);

    if (result.length === 0) {
      throw new NotFoundException('Document not found');
    }

    return {
      status: true,
      message: 'Document fetched successfully',
      data: result[0],
    };
  }

  // DELETE (SOFT DELETE)
  async deleteDocument(document_id: number) {
    if (!document_id) {
      throw new BadRequestException('document_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT document_id FROM documents WHERE document_id = $1 AND status = 1`,
      [document_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Document not found');
    }

    await this.dataSource.query(
      `UPDATE documents SET status = 0, updated_at = NOW() WHERE document_id = $1`,
      [document_id],
    );

    return {
      status: true,
      message: 'Document deleted successfully',
    };
  }

  // SEARCH
  async searchDocuments(keyword: string, page?: number, limit?: number) {
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
        d.document_id,
        d.branch_id,
        br.branch_name,
        d.doc_user_type,
        d.user_id,
        d.class_id,
        c.class_name,
        d.section_id,
        sec.section_name,
        d.doc_type,
        d.title,
        d.notes,
        d.issue_date,
        d.uploaded_by,
        d.file_url,
        CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name,

        CASE 
          WHEN d.doc_user_type = 'teacher'
            THEN CONCAT(t.first_name, ' ', t.last_name)
          WHEN d.doc_user_type = 'student'
            THEN CONCAT(s.first_name, ' ', s.last_name)
          ELSE 'Unknown'
        END AS user_name
      FROM documents d
      LEFT JOIN branches br ON br.branch_id = d.branch_id
      LEFT JOIN classes c ON c.class_id = d.class_id
      LEFT JOIN sections sec ON sec.section_id = d.section_id
      LEFT JOIN teachers t 
        ON t.teacher_id = d.user_id AND d.doc_user_type = 'teacher'
      LEFT JOIN students s 
        ON s.student_id = d.user_id AND d.doc_user_type = 'student'
      LEFT JOIN users u ON u.user_id = d.uploaded_by
      WHERE d.status = 1
        AND (
          br.branch_name ILIKE $1
          OR c.class_name ILIKE $1
          OR sec.section_name ILIKE $1
          OR d.doc_type ILIKE $1
          OR d.title ILIKE $1
          OR d.notes ILIKE $1
          OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $1
          OR (d.doc_user_type = 'teacher' AND CONCAT(t.first_name, ' ', t.last_name) ILIKE $1)
          OR (d.doc_user_type = 'student' AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $1)
        )
      ORDER BY d.document_id DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM documents d
      LEFT JOIN branches br ON br.branch_id = d.branch_id
      LEFT JOIN classes c ON c.class_id = d.class_id
      LEFT JOIN sections sec ON sec.section_id = d.section_id
      LEFT JOIN teachers t 
        ON t.teacher_id = d.user_id AND d.doc_user_type = 'teacher'
      LEFT JOIN students s 
        ON s.student_id = d.user_id AND d.doc_user_type = 'student'
      LEFT JOIN users u ON u.user_id = d.uploaded_by
      WHERE d.status = 1
        AND (
          br.branch_name ILIKE $1
          OR c.class_name ILIKE $1
          OR sec.section_name ILIKE $1
          OR d.doc_type ILIKE $1
          OR d.title ILIKE $1
          OR d.notes ILIKE $1
          OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $1
          OR (d.doc_user_type = 'teacher' AND CONCAT(t.first_name, ' ', t.last_name) ILIKE $1)
          OR (d.doc_user_type = 'student' AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $1)
        )
    `;

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, [search]))[0].count,
    );

    return {
      status: true,
      message: 'Documents search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // FILTER
  async filterDocuments(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE d.status = 1`;
    let idx = 1;

    if (filters.branch_name?.trim()) {
      conditions += ` AND br.branch_name ILIKE $${idx++}`;
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

    if (filters.doc_type?.trim()) {
      conditions += ` AND d.doc_type ILIKE $${idx++}`;
      params.push(`%${filters.doc_type.trim()}%`);
    }

    if (filters.title?.trim()) {
      conditions += ` AND d.title ILIKE $${idx++}`;
      params.push(`%${filters.title.trim()}%`);
    }

    if (filters.uploaded_by_name?.trim()) {
      conditions += ` AND CONCAT(u.first_name, ' ', u.last_name) ILIKE $${idx++}`;
      params.push(`%${filters.uploaded_by_name.trim()}%`);
    }

    if (filters.doc_user_type) {
      conditions += ` AND d.doc_user_type = $${idx++}`;
      params.push(filters.doc_user_type);
    }

    if (filters.from_date) {
      conditions += ` AND d.issue_date >= $${idx++}`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      conditions += ` AND d.issue_date <= $${idx++}`;
      params.push(filters.to_date);
    }

    const baseQuery = `
      SELECT 
        d.document_id,
        d.branch_id,
        br.branch_name,
        d.doc_user_type,
        d.user_id,
        d.class_id,
        c.class_name,
        d.section_id,
        sec.section_name,
        d.doc_type,
        d.title,
        d.notes,
        d.issue_date,
        d.uploaded_by,
        d.file_url,
        CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name,

        CASE 
          WHEN d.doc_user_type = 'teacher'
            THEN CONCAT(t.first_name, ' ', t.last_name)
          WHEN d.doc_user_type = 'student'
            THEN CONCAT(s.first_name, ' ', s.last_name)
          ELSE 'Unknown'
        END AS user_name
      FROM documents d
      LEFT JOIN branches br ON br.branch_id = d.branch_id
      LEFT JOIN classes c ON c.class_id = d.class_id
      LEFT JOIN sections sec ON sec.section_id = d.section_id
      LEFT JOIN teachers t 
        ON t.teacher_id = d.user_id AND d.doc_user_type = 'teacher'
      LEFT JOIN students s 
        ON s.student_id = d.user_id AND d.doc_user_type = 'student'
      LEFT JOIN users u ON u.user_id = d.uploaded_by
      ${conditions}
      ORDER BY d.document_id DESC
    `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Documents filtered successfully',
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
      FROM documents d
      LEFT JOIN branches br ON br.branch_id = d.branch_id
      LEFT JOIN classes c ON c.class_id = d.class_id
      LEFT JOIN sections sec ON sec.section_id = d.section_id
      LEFT JOIN users u ON u.user_id = d.uploaded_by
      ${conditions}
    `;

    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Documents filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }
}
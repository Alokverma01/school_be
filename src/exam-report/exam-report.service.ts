import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CreateExamMasterDto,
  CreateExamResultDto,
} from './exam-report.dto';
@Injectable()
export class ExamReportService {
  constructor(private readonly dataSource: DataSource) { }

  async createExam(dto: CreateExamMasterDto) {
    const fromDate = new Date(dto.start_date);
    const toDate = new Date(dto.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    

    if (fromDate < today) {
      throw new BadRequestException('Exam start date cannot be in the past');
    }

    if (toDate < fromDate) {
      throw new BadRequestException('Exam end date cannot be before start date');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Step 1: Check Duplicate Exam
      const checkQuery = `
        SELECT exam_id FROM exam_master
        WHERE exam_type = $1 AND academic_year = $2 AND branch_id = $3 
        AND (class_id = $4 OR ($4 IS NULL AND class_id IS NULL))
        AND status = 1;
      `;

      const existingExam = await manager.query(checkQuery, [
        dto.exam_type_id,
        dto.academic_year,
        dto.branch_id,
        dto.class_id || null,
      ]);

      if (existingExam.length > 0) {
        throw new BadRequestException(
          `Exam type "${dto.exam_type_id}" for academic year ${dto.academic_year} already exists for this branch/class`,
        );
      }

      
      // Step 2: Insert Exam
      const insertQuery = `
        INSERT INTO exam_master 
        (exam_name, exam_type, academic_year, start_date, end_date, branch_id, class_id, exam_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING exam_id;
      `;

      const result = await manager.query(insertQuery, [
        dto.exam_name,
        dto.exam_type_id,
        dto.academic_year,
        dto.start_date,
        dto.end_date,
        dto.branch_id,
        dto.class_id || null,
        dto.exam_status,
      ]);
      

      const exam_id = result[0]?.exam_id;

      // Step 3: Insert Subject Details if provided
      if (dto.subject_details && dto.subject_details.length > 0) {
        const examStart = new Date(dto.start_date);
        const examEnd = new Date(dto.end_date);

        const insertMappingQuery = `
          INSERT INTO exam_subject_mapping 
          (exam_id, subject_id, exam_date, start_time, end_time, max_marks, passing_marks)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        for (const subject of dto.subject_details) {
          const subjectDate = new Date(subject.exam_date);
          if (subjectDate < examStart || subjectDate > examEnd) {
            throw new BadRequestException(
              `Subject exam date ${subject.exam_date} must be between ${dto.start_date} and ${dto.end_date}`
            );
          }

          await manager.query(insertMappingQuery, [
            exam_id,
            subject.subject_id,
            subject.exam_date,
            subject.start_time || null,
            subject.end_time || null,
            subject.max_marks,
            subject.passing_marks,
          ]);
        }
      }

      return {
        status: true,
        message: 'Exam and subject details created successfully',
        exam_id,
      };
    });
  }

  async updateExam(exam_id: number, dto: CreateExamMasterDto) {
    if (!exam_id) {
      throw new NotFoundException('exam_id is required');
    }

    const checkQuery = `SELECT exam_id FROM exam_master WHERE exam_id = $1 AND status = 1`;
    const check = await this.dataSource.query(checkQuery, [exam_id]);

    if (check.length === 0) {
      throw new NotFoundException(`Exam with ID ${exam_id} not found`);
    }

    const fromDate = new Date(dto.start_date);
    const toDate = new Date(dto.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate < today) {
      throw new BadRequestException('Exam start date cannot be in the past');
    }

    if (toDate < fromDate) {
      throw new BadRequestException('Exam end date cannot be before start date');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Update exam master
      const updateQuery = `
        UPDATE exam_master 
        SET exam_name = $1, exam_type = $2, academic_year = $3, start_date = $4, end_date = $5, branch_id = $6, class_id = $7, exam_status = $8
        WHERE exam_id = $9
      `;

      await manager.query(updateQuery, [
        dto.exam_name,
        dto.exam_type_id,
        dto.academic_year,
        dto.start_date,
        dto.end_date,
        dto.branch_id,
        dto.class_id || null,
        dto.exam_status,
        exam_id,
      ]);

      // Sync subject details if provided
      if (dto.subject_details) {
        const examStart = new Date(dto.start_date);
        const examEnd = new Date(dto.end_date);

        // Option 1: Delete and Re-insert
        await manager.query(`DELETE FROM exam_subject_mapping WHERE exam_id = $1`, [exam_id]);

        if (dto.subject_details.length > 0) {
          const insertMappingQuery = `
            INSERT INTO exam_subject_mapping 
            (exam_id, subject_id, exam_date, start_time, end_time, max_marks, passing_marks)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;

          for (const subject of dto.subject_details) {
            const subjectDate = new Date(subject.exam_date);
            if (subjectDate < examStart || subjectDate > examEnd) {
              throw new BadRequestException(
                `Subject exam date ${subject.exam_date} must be between ${dto.start_date} and ${dto.end_date}`
              );
            }

            await manager.query(insertMappingQuery, [
              exam_id,
              subject.subject_id,
              subject.exam_date,
              subject.start_time || null,
              subject.end_time || null,
              subject.max_marks,
              subject.passing_marks,
            ]);
          }
        }
      }

      return { status: true, message: 'Exam and subject details updated successfully' };
    });
  }

  async getExamById(exam_id: number) {
    if (!exam_id) {
      throw new NotFoundException('exam_id is required');
    }

    const checkQuery = `SELECT exam_id FROM exam_master WHERE exam_id = $1 AND status = 1`;
    const check = await this.dataSource.query(checkQuery, [exam_id]);

    if (check.length === 0) {
      throw new NotFoundException(`Exam with ID ${exam_id} not found`);
    }

    const query = `
    SELECT em.exam_id, 
    em.exam_name,
    em.exam_type, 
    et.exam_type as exam_type_name, 
    em.academic_year, 
    em.start_date, 
    em.end_date, 
    em.branch_id, 
    b.branch_name, 
    em.class_id, 
    c.class_name, 
    em.exam_status 
    FROM exam_master em
    LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
    LEFT JOIN branches b ON em.branch_id = b.branch_id
    LEFT JOIN classes c ON em.class_id = c.class_id
    WHERE em.exam_id = $1 AND em.status = 1
    `;

    const result = await this.dataSource.query(query, [exam_id]);

    if (result.length === 0) {
      throw new NotFoundException(`Exam with ID ${exam_id} not found`);
    }

    const mappingQuery = `
      SELECT esm.id, esm.subject_id, 
      ms.id as master_subject_id,
      ms.subject_name, 
      esm.exam_date, 
      esm.start_time, 
      esm.end_time, 
      esm.max_marks, 
      esm.passing_marks
      FROM exam_subject_mapping esm
      JOIN subjects s ON esm.subject_id = s.id
      JOIN master_subjects ms ON s.master_subject_id = ms.id
      WHERE esm.exam_id = $1 AND esm.status = 1
      ORDER BY esm.exam_date ASC, esm.start_time ASC
    `;

    const subject_details = await this.dataSource.query(mappingQuery, [exam_id]);

    return {
      status: true,
      message: 'Exam Fetched by id successfully',
      data: {
        ...result[0],
        subject_details
      },
    };
  }

  async getExamsByBranch(branch_id: number) {
    if (!branch_id) {
      throw new BadRequestException('branch_id is required');
    }

    const query = `
      SELECT em.exam_id, 
      em.exam_name,
      em.exam_type, 
      et.exam_type as exam_type_name, 
      em.academic_year, 
      em.start_date, 
      em.end_date, 
      em.branch_id, 
      em.class_id, 
      b.branch_name, 
      c.class_name, 
      em.exam_status
      FROM exam_master em
      LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
      LEFT JOIN branches b ON em.branch_id = b.branch_id
      LEFT JOIN classes c ON em.class_id = c.class_id
      WHERE em.branch_id = $1 AND em.status = 1
      ORDER BY em.exam_id DESC
    `;

    const result = await this.dataSource.query(query, [branch_id]);

    for (let i = 0; i < result.length; i++) {
      const mappingQuery = `
          SELECT esm.id, esm.subject_id, 
          ms.subject_name, 
          esm.exam_date, 
          esm.start_time, 
          esm.end_time, 
          esm.max_marks, 
          esm.passing_marks
          FROM exam_subject_mapping esm
          INNER JOIN subjects s ON esm.subject_id = s.id
          INNER JOIN master_subjects ms ON s.master_subject_id = ms.id
          WHERE esm.exam_id = $1 AND esm.status = 1
          ORDER BY esm.exam_date ASC
        `;
      result[i].subject_details = await this.dataSource.query(mappingQuery, [result[i].exam_id]);
    }

    return {
      status: true,
      message: result.length === 0 ? 'No exams found for this branch' : 'Exams fetched by branch successfully',
      data: result,
      totalRecords: result.length,
    };
  }

  async getAllExams(page?: number, limit?: number) {
    let query = `
    SELECT em.exam_id, em.exam_name, em.exam_type, et.exam_type as exam_type_name, 
    em.academic_year, em.start_date, em.end_date, em.branch_id, b.branch_name, 
    em.class_id, c.class_name, em.exam_status
    FROM exam_master em
    JOIN branches b ON em.branch_id = b.branch_id
    LEFT JOIN classes c ON em.class_id = c.class_id
    LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
    WHERE em.status = 1
    ORDER BY em.exam_id DESC
  `;

    // Case: No Pagination → return full data
    if (!page || !limit) {
      const result = await this.dataSource.query(query);

      for (let i = 0; i < result.length; i++) {
        const mappingQuery = `
          SELECT esm.id, esm.subject_id, 
          ms.subject_name, 
          esm.exam_date, esm.start_time, esm.end_time, 
          esm.max_marks, esm.passing_marks
          FROM exam_subject_mapping esm
          INNER JOIN subjects s ON esm.subject_id = s.id
          INNER JOIN master_subjects ms ON s.master_subject_id = ms.id
          WHERE esm.exam_id = $1 AND esm.status = 1
          ORDER BY esm.exam_date ASC
        `;
        result[i].subject_details = await this.dataSource.query(mappingQuery, [result[i].exam_id]);
      }

      return {
        status: true,
        message: 'Exam list fetched successfully',
        data: result,
        totalRecords: result.length,
      };
    }

    const offset = (page - 1) * limit;

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM exam_master WHERE status = 1`,
    );
    const total = Number(countResult[0].count);

    query += ` LIMIT $1 OFFSET $2`;
    const result = await this.dataSource.query(query, [limit, offset]);

    for (let i = 0; i < result.length; i++) {
      const mappingQuery = `
          SELECT esm.id, esm.subject_id, 
          ms.subject_name, 
          esm.exam_date, esm.start_time, esm.end_time, 
          esm.max_marks, esm.passing_marks
          FROM exam_subject_mapping esm
          INNER JOIN subjects s ON esm.subject_id = s.id
          INNER JOIN master_subjects ms ON s.master_subject_id = ms.id
          WHERE esm.exam_id = $1 AND esm.status = 1
          ORDER BY esm.exam_date ASC
        `;
      result[i].subject_details = await this.dataSource.query(mappingQuery, [result[i].exam_id]);
    }

    return {
      status: true,
      message: 'Exam list fetched successfully',
      data: result,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteExam(exam_id: number) {
    if (!exam_id) {
      throw new NotFoundException('exam_id is required');
    }

    const checkQuery = `SELECT exam_id FROM exam_master WHERE exam_id = $1 AND status = 1`;
    const check = await this.dataSource.query(checkQuery, [exam_id]);

    if (check.length === 0) {
      throw new NotFoundException(`Exam with ID ${exam_id} not found`);
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Soft delete the exam
      const deleteExamQuery = `UPDATE exam_master SET status = 0 WHERE exam_id = $1`;
      await manager.query(deleteExamQuery, [exam_id]);

      // 2. Soft delete associated subject mappings
      const deleteMappingsQuery = `UPDATE exam_subject_mapping SET status = 0 WHERE exam_id = $1`;
      await manager.query(deleteMappingsQuery, [exam_id]);

      return { status: true, message: 'Exam and its subject mappings deleted successfully' };
    });
  }


  // result
  async recordResult(dto: CreateExamResultDto) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Check if summary already exists
      const checkSummary = await manager.query(
        `SELECT result_id FROM exam_result_summary WHERE exam_id = $1 AND student_id = $2 AND status = 1`,
        [dto.exam_id, dto.student_id]
      );

      if (checkSummary.length > 0) {
        throw new BadRequestException('Result summary already exists for this exam and student');
      }

      // 2. Insert Summary (Header)
      const insertSummaryQuery = `
      INSERT INTO exam_result_summary 
      (branch_id, class_id, section_id, exam_id, student_id, total_obtained_marks, total_max_marks, percentage, grade, remarks, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
      RETURNING result_id
    `;

      const summaryResult = await manager.query(insertSummaryQuery, [
        dto.branch_id,
        dto.class_id,
        dto.section_id,
        dto.exam_id,
        dto.student_id,
        dto.total_obtained_marks,
        dto.total_max_marks,
        dto.percentage,
        dto.grade,
        dto.remarks || null
      ]);

      const result_id = summaryResult[0].result_id;

      // 3. Insert all subject marks (Items)
      const insertItemQuery = `
      INSERT INTO exam_result (result_id, subject_id, obtained_marks, max_marks, passing_marks, status)
      VALUES ($1, $2, $3, $4, $5, 1)
    `;

      for (const mark of dto.marks_details) {
        await manager.query(insertItemQuery, [
          result_id,
          mark.subject_id,
          mark.obtained_marks,
          mark.max_marks,
          mark.passing_marks
        ]);
      }

      return {
        status: true,
        message: 'Complete result recorded successfully',
        result_id,
      };
    });
  }

  async updateResult(result_id: number, dto: CreateExamResultDto) {
    if (!result_id) {
      throw new BadRequestException('result_id is required');
    }

    const checkQuery = `SELECT result_id FROM exam_result_summary WHERE result_id = $1 AND status = 1`;
    const check = await this.dataSource.query(checkQuery, [result_id]);

    if (check.length === 0) {
      throw new NotFoundException(`Result with ID ${result_id} not found`);
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Update summary
      const updateSummaryQuery = `
        UPDATE exam_result_summary
        SET 
        branch_id = $1,
        class_id = $2,
        section_id = $3,
        exam_id = $4,
        student_id = $5,
        total_obtained_marks = $6,
        total_max_marks = $7,
        percentage = $8,
        grade = $9,
        remarks = $10,
        updated_at = NOW()
        WHERE result_id = $11
      `;

      await manager.query(updateSummaryQuery, [
        dto.branch_id,
        dto.class_id,
        dto.section_id,
        dto.exam_id,
        dto.student_id,
        dto.total_obtained_marks,
        dto.total_max_marks,
        dto.percentage,
        dto.grade,
        dto.remarks || null,
        result_id
      ]);

      // 2. Sync marks details
      if (dto.marks_details) {
        await manager.query(`DELETE FROM exam_result WHERE result_id = $1`, [result_id]);

        const insertItemQuery = `
          INSERT INTO exam_result (result_id, subject_id, obtained_marks, max_marks, passing_marks, status)
          VALUES ($1, $2, $3, $4, $5, 1)
        `;

        for (const mark of dto.marks_details) {
          await manager.query(insertItemQuery, [
            result_id,
            mark.subject_id,
            mark.obtained_marks,
            mark.max_marks,
            mark.passing_marks
          ]);
        }
      }

      return { status: true, message: 'Result updated successfully' };
    });
  }

  async getResultById(result_id: number) {
    if (!result_id) {
      throw new BadRequestException('result_id is required');
    }

    const query = `
    SELECT 
      ers.result_id, ers.branch_id, b.branch_name, ers.exam_id, em.exam_type, et.exam_type as exam_type_name,
      ers.class_id, c.class_name, ers.section_id, sec.section_name,
      ers.student_id, CONCAT(s.first_name, ' ', s.last_name) as student_name,
      ers.total_obtained_marks, ers.total_max_marks, ers.percentage, ers.grade, ers.remarks
    FROM exam_result_summary ers
    JOIN exam_master em ON ers.exam_id = em.exam_id
    LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
    JOIN branches b ON ers.branch_id = b.branch_id
    JOIN classes c ON ers.class_id = c.class_id
    JOIN sections sec ON ers.section_id = sec.section_id
    JOIN students s ON ers.student_id = s.student_id
    WHERE ers.result_id = $1 AND ers.status = 1
  `;

    const result = await this.dataSource.query(query, [result_id]);

    if (result.length === 0) {
      throw new NotFoundException(`Result with ID ${result_id} not found`);
    }

    const marksQuery = `
      SELECT er.id, er.subject_id, ms.subject_name, er.obtained_marks, er.max_marks, er.passing_marks,
      ms.id as master_subject_id
      FROM exam_result er
      JOIN subjects sub ON er.subject_id = sub.id
      JOIN master_subjects ms ON sub.master_subject_id = ms.id
      WHERE er.result_id = $1 AND er.status = 1
    `;

    const marks_details = await this.dataSource.query(marksQuery, [result_id]);

    return {
      status: true,
      message: 'Result fetched successfully',
      data: {
        ...result[0],
        marks_details
      },
    };
  }

  async getAllResults(page?: number, limit?: number) {
    let baseQuery = `
    SELECT 
      ers.result_id, ers.branch_id, b.branch_name, ers.exam_id, em.exam_type, et.exam_type as exam_type_name,
      ers.class_id, c.class_name, ers.section_id, sec.section_name,
      ers.student_id, CONCAT(s.first_name, ' ', s.last_name) as student_name,
      ers.total_obtained_marks, ers.total_max_marks, ers.percentage, ers.grade, ers.remarks
    FROM exam_result_summary ers
    JOIN exam_master em ON ers.exam_id = em.exam_id
    LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
    JOIN branches b ON ers.branch_id = b.branch_id
    JOIN classes c ON ers.class_id = c.class_id
    JOIN sections sec ON ers.section_id = sec.section_id
    JOIN students s ON ers.student_id = s.student_id
    WHERE ers.status = 1
    ORDER BY ers.result_id DESC
   `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery);

      for (let i = 0; i < data.length; i++) {
        const marksQuery = `
          SELECT er.id, er.subject_id, ms.subject_name, er.obtained_marks, er.max_marks, er.passing_marks
          FROM exam_result er
          JOIN subjects sub ON er.subject_id = sub.id
          JOIN master_subjects ms ON sub.master_subject_id = ms.id
          WHERE er.result_id = $1 AND er.status = 1
        `;
        data[i].marks_details = await this.dataSource.query(marksQuery, [data[i].result_id]);
      }

      return {
        status: true,
        message: "All results fetched successfully",
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM exam_result_summary WHERE status = 1`,
    );
    const total = Number(countResult[0].count);

    const paginatedQuery = `${baseQuery} LIMIT $1 OFFSET $2`;
    const data = await this.dataSource.query(paginatedQuery, [limit, offset]);

    for (let i = 0; i < data.length; i++) {
      const marksQuery = `
        SELECT er.id, er.subject_id, ms.subject_name, er.obtained_marks, er.max_marks, er.passing_marks
        FROM exam_result er
        JOIN subjects sub ON er.subject_id = sub.id
        JOIN master_subjects ms ON sub.master_subject_id = ms.id
        WHERE er.result_id = $1 AND er.status = 1
      `;
      data[i].marks_details = await this.dataSource.query(marksQuery, [data[i].result_id]);
    }

    return {
      status: true,
      message: "Paginated results fetched successfully",
      data,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteResult(id: number) {
    if (!id) {
      throw new BadRequestException('result_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT result_id FROM exam_result_summary WHERE result_id = $1 AND status = 1`,
      [id],
    );

    if (exists.length === 0) {
      throw new NotFoundException(`Result with ID ${id} not found`);
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Soft delete summary
      await manager.query(
        `UPDATE exam_result_summary SET status = 0, updated_at = NOW() WHERE result_id = $1`,
        [id]
      );

      // 2. Soft delete items
      await manager.query(
        `UPDATE exam_result SET status = 0, updated_at = NOW() WHERE result_id = $1`,
        [id]
      );

      return {
        status: true,
        message: 'Result and its subject marks deleted successfully',
      };
    });
  }

  // --- Exam Search & Filter ---
  async searchExam(keyword: string, page?: number, limit?: number) {
    const search = `%${keyword}%`;
    let params: any[] = [search];
    let pagination = '';

    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
      SELECT em.exam_id, em.exam_name, em.exam_type, et.exam_type as exam_type_name, em.academic_year, em.start_date, em.end_date, em.branch_id, b.branch_name, em.class_id, c.class_name, em.exam_status
      FROM exam_master em
      JOIN branches b ON em.branch_id = b.branch_id
      LEFT JOIN classes c ON em.class_id = c.class_id
      LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
      WHERE em.status = 1
        AND (
          em.exam_name ILIKE $1
          OR et.exam_type ILIKE $1
          OR em.academic_year ILIKE $1
          OR b.branch_name ILIKE $1
          OR c.class_name ILIKE $1
        )
      ORDER BY em.exam_id DESC
      ${pagination}
    `;

    const result = await this.dataSource.query(query, params);

    for (let i = 0; i < result.length; i++) {
      const mappingQuery = `
          SELECT esm.id, esm.subject_id, ms.subject_name, esm.exam_date, esm.start_time, esm.end_time, esm.max_marks, esm.passing_marks
          FROM exam_subject_mapping esm
          JOIN subjects s ON esm.subject_id = s.id
          JOIN master_subjects ms ON s.master_subject_id = ms.id
          WHERE esm.exam_id = $1 AND esm.status = 1
          ORDER BY esm.exam_date ASC
        `;
      result[i].subject_details = await this.dataSource.query(mappingQuery, [result[i].exam_id]);
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM exam_master em
      JOIN branches b ON em.branch_id = b.branch_id
      LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
      WHERE em.status = 1
        AND (
          em.exam_name ILIKE $1
          OR et.exam_type ILIKE $1
          OR em.academic_year ILIKE $1
          OR b.branch_name ILIKE $1
        )
    `;

    const totalRecords = Number((await this.dataSource.query(countQuery, [search]))[0].count);

    return {
      status: true,
      message: 'Exam search results fetched successfully',
      data: result,
      totalRecords,
      totalPages: page !== undefined && limit !== undefined ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterExam(filters: any, page?: number, limit?: number) {
    let conditions = 'WHERE em.status = 1';
    const params: any[] = [];
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name ILIKE $${idx++}`;
      params.push(filters.branch_name);
    }
    if (filters.class_name) {
      conditions += ` AND c.class_name ILIKE $${idx++}`;
      params.push(filters.class_name);
    }
    if (filters.exam_type) {
      conditions += ` AND em.exam_type = $${idx++}`;
      params.push(filters.exam_type);
    }
    if (filters.academic_year) {
      conditions += ` AND em.academic_year ILIKE $${idx++}`;
      params.push(filters.academic_year);
    }
    if (filters.exam_status) {
      conditions += ` AND em.exam_status = $${idx++}`;
      params.push(filters.exam_status);
    }

    let pagination = '';
    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    const query = `
      SELECT em.exam_id, em.exam_name, em.exam_type, et.exam_type as exam_type_name, em.academic_year, em.start_date, em.end_date, em.branch_id, b.branch_name, em.class_id, c.class_name, em.exam_status
      FROM exam_master em
      JOIN branches b ON em.branch_id = b.branch_id
      LEFT JOIN classes c ON em.class_id = c.class_id
      LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
      ${conditions}
      ORDER BY em.exam_id DESC
      ${pagination}
    `;

    const result = await this.dataSource.query(query, params);

    for (let i = 0; i < result.length; i++) {
      const mappingQuery = `
          SELECT esm.id, esm.subject_id, ms.subject_name, esm.exam_date, esm.start_time, esm.end_time, esm.max_marks, esm.passing_marks
          FROM exam_subject_mapping esm
          JOIN subjects s ON esm.subject_id = s.id
          JOIN master_subjects ms ON s.master_subject_id = ms.id

          WHERE esm.exam_id = $1 AND esm.status = 1
          ORDER BY esm.exam_date ASC
        `;
      result[i].subject_details = await this.dataSource.query(mappingQuery, [result[i].exam_id]);
    }

    const countParams = page !== undefined && limit !== undefined ? params.slice(0, params.length - 2) : params;
    const countQuery = `SELECT COUNT(*) FROM exam_master em 
    JOIN branches b ON em.branch_id = b.branch_id
    LEFT JOIN classes c ON em.class_id = c.class_id
    ${conditions}`;

    const totalRecords = Number((await this.dataSource.query(countQuery, countParams))[0].count);

    return {
      status: true,
      message: 'Filtered exams fetched successfully',
      data: result,
      totalRecords,
      totalPages: page !== undefined && limit !== undefined ? Math.ceil(totalRecords / limit) : 1,
    };
  }



  // --- Exam Result Search & Filter ---

  async searchResult(keyword: string, page?: number, limit?: number) {
    const search = `%${keyword}%`;
    let params: any[] = [search];
    let pagination = '';

    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const query = `
      SELECT ers.result_id, ers.branch_id, b.branch_name, ers.exam_id, em.exam_type, et.exam_type as exam_type_name,
             ers.class_id, c.class_name, ers.section_id, sec.section_name,
             ers.student_id, CONCAT(s.first_name, ' ', s.last_name) as student_name,
             ers.total_obtained_marks, ers.total_max_marks, ers.percentage, ers.grade, ers.remarks
      FROM exam_result_summary ers
      JOIN exam_master em ON ers.exam_id = em.exam_id
      LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
      JOIN branches b ON ers.branch_id = b.branch_id
      JOIN classes c ON ers.class_id = c.class_id
      JOIN sections sec ON ers.section_id = sec.section_id
      JOIN students s ON ers.student_id = s.student_id
      WHERE ers.status = 1
        AND (
          CONCAT(s.first_name, ' ', s.last_name) ILIKE $1
          OR et.exam_type ILIKE $1
          OR b.branch_name ILIKE $1
          OR c.class_name ILIKE $1
          OR sec.section_name ILIKE $1
        )
      ORDER BY ers.result_id DESC
      ${pagination}
    `;

    const result = await this.dataSource.query(query, params);

    for (let i = 0; i < result.length; i++) {
      const marksQuery = `
          SELECT er.id, er.subject_id, ms.subject_name, er.obtained_marks, er.max_marks, er.passing_marks
          FROM exam_result er
          JOIN subjects sub ON er.subject_id = sub.id
          JOIN master_subjects ms ON sub.master_subject_id = ms.id
          WHERE er.result_id = $1 AND er.status = 1
        `;
      result[i].marks_details = await this.dataSource.query(marksQuery, [result[i].result_id]);
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM exam_result_summary ers
      JOIN students s ON ers.student_id = s.student_id
      JOIN exam_master em ON ers.exam_id = em.exam_id
      JOIN branches b ON ers.branch_id = b.branch_id
      JOIN classes c ON ers.class_id = c.class_id
      JOIN sections sec ON ers.section_id = sec.section_id
      LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
      WHERE ers.status = 1
        AND (
          CONCAT(s.first_name, ' ', s.last_name) ILIKE $1
          OR et.exam_type ILIKE $1
          OR b.branch_name ILIKE $1
          OR c.class_name ILIKE $1
          OR sec.section_name ILIKE $1
        )
    `;

    const totalRecords = Number((await this.dataSource.query(countQuery, [search]))[0].count);

    return {
      status: true,
      message: 'Exam result search results fetched successfully',
      data: result,
      totalRecords,
      totalPages: page !== undefined && limit !== undefined ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterResult(filters: any, page?: number, limit?: number) {
    let conditions = 'WHERE er.status = 1';
    const params: any[] = [];
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name ILIKE $${idx++}`;
      params.push(filters.branch_name);
    }
    if (filters.class_name) {
      conditions += ` AND c.class_name ILIKE $${idx++}`;
      params.push(filters.class_name);
    }
    if (filters.section_name) {
      conditions += ` AND sec.section_name ILIKE $${idx++}`;
      params.push(filters.section_name);
    }
    if (filters.exam_type) {
      conditions += ` AND em.exam_type = $${idx++}`;
      params.push(filters.exam_type);
    }
    if (filters.student_name) {
      conditions += ` AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $${idx++}`;
      params.push(filters.student_name);
    }
    // if (filters.subject_name) {
    //   conditions += ` AND sub.name ILIKE $${idx++}`;
    //   params.push(filters.subject_name);
    // }
    // if (filters.grade) {
    //   conditions += ` AND er.grade ILIKE $${idx++}`;
    //   params.push(filters.grade);
    // }

    let pagination = '';
    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    const query = `
      SELECT ers.result_id, ers.branch_id, b.branch_name, ers.exam_id, em.exam_type, et.exam_type as exam_type_name,
             ers.class_id, c.class_name, ers.section_id, sec.section_name,
             ers.student_id, CONCAT(s.first_name, ' ', s.last_name) as student_name,
             ers.total_obtained_marks, ers.total_max_marks, ers.percentage, ers.grade, ers.remarks
      FROM exam_result_summary ers
      JOIN exam_master em ON ers.exam_id = em.exam_id
      LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
      JOIN branches b ON ers.branch_id = b.branch_id
      JOIN classes c ON ers.class_id = c.class_id
      JOIN sections sec ON ers.section_id = sec.section_id
      JOIN students s ON ers.student_id = s.student_id
      ${conditions.replace(/er\./g, 'ers.')}
      ORDER BY ers.result_id DESC
      ${pagination}
    `;

    const result = await this.dataSource.query(query, params);

    for (let i = 0; i < result.length; i++) {
      const marksQuery = `
          SELECT er.id, er.subject_id, ms.subject_name, er.obtained_marks, er.max_marks, er.passing_marks
          FROM exam_result er
          JOIN subjects sub ON er.subject_id = sub.id
          JOIN master_subjects ms ON sub.master_subject_id = ms.id
          WHERE er.result_id = $1 AND er.status = 1
        `;
      result[i].marks_details = await this.dataSource.query(marksQuery, [result[i].result_id]);
    }

    const countParams = page !== undefined && limit !== undefined ? params.slice(0, params.length - 2) : params;
    const countQuery = `SELECT COUNT(*) FROM exam_result_summary ers 
    JOIN exam_master em ON ers.exam_id = em.exam_id
    JOIN students s ON ers.student_id = s.student_id
    JOIN classes c ON ers.class_id = c.class_id
    JOIN sections sec ON ers.section_id = sec.section_id
    JOIN branches b ON ers.branch_id = b.branch_id
    LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
    ${conditions.replace(/er\./g, 'ers.')}`;

    const totalRecords = Number((await this.dataSource.query(countQuery, countParams))[0].count);

    return {
      status: true,
      message: 'Filtered results fetched successfully',
      data: result,
      totalRecords,
      totalPages: page !== undefined && limit !== undefined ? Math.ceil(totalRecords / limit) : 1,
    };
  }
}


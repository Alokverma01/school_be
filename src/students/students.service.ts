import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentsService {
  constructor(private dataSource: DataSource) { }

  async createStudent(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        branch_id,
        class_id,
        section_id,
        first_name,
        last_name,
        dob,
        email,
        gender,
        student_aadhar,
        admission_number,
        roll_number,
        is_EWS,
        address,
        parent_first_name,
        parent_last_name,
        parent_contact,
        parent_aadhar,
        relation,
        parent_email,
        siblings,
        health,
      } = data;

      // Check Duplicate
      const exists = await queryRunner.query(
        `SELECT student_id, student_aadhar, admission_number, roll_number  
       FROM students 
       WHERE student_aadhar = $1 OR admission_number = $2 OR roll_number = $3 LIMIT 1`,
        [student_aadhar, admission_number, roll_number],
      );

      if (exists.length > 0) {
        if (exists[0].student_aadhar === student_aadhar)
          throw new BadRequestException(
            'A student with this Aadhar already exists.',
          );

        if (exists[0].admission_number === admission_number)
          throw new BadRequestException('Admission number already exists.');
      }

      // --- Room Capacity Validation ---
      const roomCapacityResult = await queryRunner.query(
        `SELECT r.capacity, r.name as room_name 
         FROM class_section_assign csa
         INNER JOIN rooms r ON r.id = csa.room_id
         WHERE csa.branch_id = $1 AND csa.class_id = $2 AND csa.section_id = $3 AND csa.status = 1`,
        [ branch_id, class_id, section_id],
      );

      if (roomCapacityResult.length > 0) {
        const { capacity, room_name } = roomCapacityResult[0];

        const currentStudentCountResult = await queryRunner.query(
          `SELECT COUNT(*) as count FROM students 
           WHERE branch_id = $1 AND class_id = $2 AND section_id = $3 AND status = 1`,
          [branch_id, class_id, section_id],
        );

        const currentCount = parseInt(currentStudentCountResult[0].count, 10);

        if (currentCount >= capacity) {
          throw new BadRequestException(
            `Room ${room_name} is full. Capacity: ${capacity}, Current Students: ${currentCount}`,
          );
        }
      }

      // Insert Student
      const studentRes = await queryRunner.query(
        `INSERT INTO students (branch_id, class_id, section_id, first_name, last_name, dob, gender, student_aadhar, admission_number, roll_number, is_ews, address, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING student_id`,
        [
          branch_id,
          class_id,
          section_id,
          first_name,
          last_name,
          dob,
          gender,
          student_aadhar,
          admission_number,
          roll_number,
          is_EWS,
          address,
          email,
        ],
      );

      const student_id = studentRes[0].student_id;

      // Insert Parent
      const parentRes = await queryRunner.query(
        `INSERT INTO parents (first_name, last_name, contact_number, parent_aadhar, relation, email)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING parent_id`,
        [
          parent_first_name,
          parent_last_name,
          parent_contact,
          parent_aadhar,
          relation,
          parent_email,
        ],
      );

      const parent_id = parentRes[0].parent_id;

      // Map Parent to Student
      await queryRunner.query(
        `INSERT INTO student_parent_mapping(student_id, parent_id) VALUES ($1,$2)`,
        [student_id, parent_id],
      );

      // Insert Health IF Provided
      if (
        health?.blood_group ||
        health?.allergies ||
        health?.medical_condition
      ) {
        await queryRunner.query(
          `INSERT INTO student_health (student_id, blood_group, allergies, medical_conditions)
         VALUES ($1,$2,$3,$4)`,
          [
            student_id,
            health.blood_group || null,
            health.allergies || null,
            health.medical_conditions || null,
          ],
        );
      }

      // Insert Sibling Mapping IF Provided
      if (Array.isArray(siblings) && siblings.length > 0) {
        for (const s of siblings) {
          await queryRunner.query(
            `INSERT INTO student_sibling_mapping (student_id, sibling_id, relation_type)
           VALUES ($1,$2,$3)`,
            [student_id, s.sibling_id, s.relation_type],
          );
        }
      }

      // Commit successfully
      await queryRunner.commitTransaction();

      return {
        status: true,
        message: 'Student registered successfully',
        student_id,
        parent_id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // async findBySectionId(sectionId: number) {
  //   if (!sectionId) {
  //     throw new BadRequestException('sectionId is required');
  //   }

  //   const query = `
  //   SELECT 
  //     students.student_id,
  //     students.first_name,
  //     students.last_name,
  //     CONCAT(students.first_name , ' ' , students.last_name) as student_name,
  //     students.roll_number,
  //     classes.class_name,
  //     sections.section_name
  //   FROM students
  //   INNER JOIN classes ON students.class_id = classes.class_id
  //   INNER JOIN sections ON students.section_id = sections.section_id
  //   WHERE students.section_id = $1
  //   ORDER BY students.roll_number ASC;
  // `;

  //   const result = await this.dataSource.query(query, [sectionId]);

  //   return {
  //     status: true,
  //     count: result.length,
  //     students: result,
  //   };
  // }

  async getAllStudents(page?: number, limit?: number) {
    let query = `
    SELECT
      s.student_id,
      s.branch_id,
      b.branch_name,
      s.roll_number,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      b.branch_name,
      c.class_name,
      sec.section_name,
      TO_CHAR(s.dob, 'DD-MM-YYYY') AS dob,
      s.email AS student_email,
      s.gender,
      s.student_aadhar,
      s.admission_number,
      CASE WHEN s.is_ews = true THEN 'Yes' ELSE 'No' END AS is_ews,
      s.address,
      CONCAT(p.first_name, ' ', p.last_name) AS parent_name,
      p.contact_number AS parent_contact,
      p.email AS parent_email,
      p.relation AS parent_relation
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.class_id
    LEFT JOIN sections sec ON s.section_id = sec.section_id
    LEFT JOIN branches b ON s.branch_id = b.branch_id
    LEFT JOIN student_parent_mapping spm ON s.student_id = spm.student_id
    LEFT JOIN parents p ON spm.parent_id = p.parent_id
    WHERE s.status = 1
    ORDER BY s.student_id DESC
  `;

    const params: any[] = [];

    if (page && limit) {
      const pNum = Number(page);
      const lNum = Number(limit);
      const offset = (pNum - 1) * lNum;
      query += ` LIMIT $1 OFFSET $2`;
      params.push(lNum, offset);
    }

    const data = await this.dataSource.query(query, params);

    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM students WHERE status = 1`,
    );

    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: 'Students fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async getStudentById(student_id: number) {
    if (!student_id) {
      throw new BadRequestException('student_id is required');
    }

    const query = `
    SELECT 
      -- Student Info
      s.student_id,
      s.branch_id,
      s.class_id,
      c.class_name,
      s.section_id,
      sec.section_name,
      s.first_name,
      s.last_name,
      s.email AS student_email,
      TO_CHAR(s.dob, 'YYYY-MM-DD') AS dob,
      s.gender,
      s.student_aadhar,
      s.admission_number,
      s.roll_number,
      s.is_ews,
      s.address,

      -- Parent Info
      p.parent_id,
      p.first_name AS parent_first_name,
      p.last_name AS parent_last_name,
      p.contact_number AS parent_contact,
      p.parent_aadhar,
      p.email AS parent_email,
      p.relation AS parent_relation,

      -- Health Info
      sh.blood_group,
      sh.allergies,
      sh.medical_conditions,

      -- Siblings as JSON array
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'sibling_id', sibling_student.student_id,
            'sibling_name', sibling_student.first_name || ' ' || COALESCE(sibling_student.last_name, ''),
            'relation_type', ssm.relation_type
          )
        ) FILTER (WHERE sibling_student.student_id IS NOT NULL),
        '[]'
      ) AS siblings

    FROM students s
    LEFT JOIN classes c ON s.class_id = c.class_id
    LEFT JOIN sections sec ON s.section_id = sec.section_id AND sec.status = 1

    -- Parent
    LEFT JOIN student_parent_mapping spm ON s.student_id = spm.student_id
    LEFT JOIN parents p ON spm.parent_id = p.parent_id

    -- Health
    LEFT JOIN student_health sh ON s.student_id = sh.student_id

    -- Siblings
    LEFT JOIN student_sibling_mapping ssm ON s.student_id = ssm.student_id
    LEFT JOIN students sibling_student ON ssm.sibling_id = sibling_student.student_id 
      AND sibling_student.status = 1

    WHERE s.student_id = $1 
      AND s.status = 1

    GROUP BY 
      s.student_id, s.branch_id, s.class_id, c.class_name, 
      s.section_id, sec.section_name,
      s.first_name, s.last_name, s.email, s.dob, s.gender,
      s.student_aadhar, s.admission_number, s.roll_number, s.is_ews, s.address,
      p.parent_id, p.first_name, p.last_name, p.contact_number, 
      p.parent_aadhar, p.email, p.relation,
      sh.blood_group, sh.allergies, sh.medical_conditions
    LIMIT 1
  `;

    const result = await this.dataSource.query(query, [student_id]);

    if (result.length === 0) {
      throw new NotFoundException(`Student with ID ${student_id} not found`);
    }

    // Parse siblings from jsonb[] → normal array
    const student = result[0];
    try {
      student.siblings =
        typeof student.siblings === 'string'
          ? JSON.parse(student.siblings)
          : student.siblings;
    } catch (e) {
      student.siblings = [];
    }

    return {
      status: true,
      message: 'Student fetched successfully',
      data: student,
    };
  }

  async getStudentsByBranchClassAndSection(branch_id: number, classId: number, sectionId: number) {
    if (!branch_id || !classId || !sectionId) {
      throw new BadRequestException(
        'Both branch_id, class_id and section_id are required',
      );
    }

    const query = `
    SELECT 
      student_id,
      CONCAT(first_name ,' ',last_name) as student_name
    FROM students
    WHERE branch_id=$1 AND class_id=$2 AND section_id=$3 AND status=1
    ORDER BY student_id ASC
  `;

    const result = await this.dataSource.query(query, [branch_id, classId, sectionId]);

    return {
      status: true,
      message:
        result.length > 0
          ? 'Students fetched successfully'
          : 'No students found for this class and section',
      data: result,
    };
  }

  async updateStudent(student_id: number, data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        branch_id,
        class_id,
        section_id,
        first_name,
        last_name,
        dob,
        email,
        gender,
        student_aadhar,
        admission_number,
        roll_number,
        is_ews,
        address,

        parent_first_name,
        parent_last_name,
        parent_contact,
        parent_aadhar,
        parent_email,
        relation,

        health,
        siblings,
      } = data;

      // 1. Validate student exists
      const studentExists = await queryRunner.query(
        `SELECT 1 FROM students WHERE student_id = $1 AND status = 1`,
        [student_id],
      );
      if (studentExists.length === 0) {
        throw new NotFoundException('Student not found or already deleted');
      }

      // --- Room Capacity Validation ---
      if (class_id && section_id) {
        const roomCapacityResult = await queryRunner.query(
          `SELECT r.capacity, r.name as room_name 
           FROM class_section_assign csa
           INNER JOIN rooms r ON r.id = csa.room_id
           WHERE csa.class_id = $1 AND csa.section_id = $2 AND csa.status = 1`,
          [class_id, section_id],
        );

        if (roomCapacityResult.length > 0) {
          const { capacity, room_name } = roomCapacityResult[0];

          // Count other students in this class/section
          const currentStudentCountResult = await queryRunner.query(
            `SELECT COUNT(*) as count FROM students 
             WHERE class_id = $1 AND section_id = $2 AND status = 1 AND student_id <> $3`,
            [class_id, section_id, student_id],
          );

          const currentCount = parseInt(currentStudentCountResult[0].count, 10);

          if (currentCount >= capacity) {
            throw new BadRequestException(
              `Room ${room_name} is full. Capacity: ${capacity}, Current Students: ${currentCount}`,
            );
          }
        }
      }

      // 2. Update Student
      await queryRunner.query(
        `UPDATE students SET
        branch_id = $1, class_id = $2, section_id = $3,
        first_name = $4, last_name = $5, dob = $6, email = $7,
        gender = $8, student_aadhar = $9, admission_number = $10,
        roll_number = $11, is_ews = $12, address = $13,
        updated_at = NOW()
      WHERE student_id = $14`,
        [
          branch_id,
          class_id,
          section_id,
          first_name,
          last_name,
          dob || null,
          email || null,
          gender,
          student_aadhar,
          admission_number,
          roll_number || null,
          is_ews ?? false,
          address || null,
          student_id,
        ],
      );

      // 3. Update Parent
      const parentMap = await queryRunner.query(
        `SELECT parent_id FROM student_parent_mapping WHERE student_id = $1 LIMIT 1`,
        [student_id],
      );

      if (parentMap.length === 0) {
        throw new BadRequestException('Parent not linked to this student');
      }

      const parent_id = parentMap[0].parent_id;

      await queryRunner.query(
        `UPDATE parents SET
        first_name = $1, last_name = $2, contact_number = $3,
        parent_aadhar = $4, relation = $5, email = $6,
        updated_at = NOW()
       WHERE parent_id = $7`,
        [
          parent_first_name,
          parent_last_name,
          parent_contact,
          parent_aadhar,
          relation,
          parent_email || null,
          parent_id,
        ],
      );

      // 4. Update Health – ONLY update existing
      if (health !== undefined) {
        await queryRunner.query(
          `UPDATE student_health 
           SET 
             blood_group = $1,
             allergies = $2,
             medical_conditions = $3,
             updated_at = NOW()
           WHERE student_id = $4`,
          [
            health.blood_group || null,
            health.allergies || null,
            health.medical_conditions || null,
            student_id,
          ],
        );
      }

      // 5. Update Siblings – ONLY update existing mappings
      if (Array.isArray(siblings) && siblings.length > 0) {
        for (const sib of siblings) {
          if (sib.sibling_id) {
            await queryRunner.query(
              `UPDATE student_sibling_mapping 
               SET relation_type = $1
               WHERE student_id = $2 AND sibling_id = $3`,
              [sib.relation_type || 'Sibling', student_id, sib.sibling_id],
            );
          }
        }
      }

      await queryRunner.commitTransaction();

      return {
        status: true,
        message: 'Student updated successfully',
        student_id,
        parent_id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error instanceof HttpException
        ? error
        : new BadRequestException(error.message || 'Failed to update student');
    } finally {
      await queryRunner.release();
    }
  }

  async deleteStudent(student_id: number) {
    if (!student_id) {
      throw new BadRequestException('student_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT student_id FROM students WHERE student_id = $1 AND status = 1 LIMIT 1`,
      [student_id],
    );

    if (exists.length === 0) {
      throw new BadRequestException('Student does not exist');
    }

    const result = await this.dataSource.query(
      `UPDATE students SET status = 0, updated_at = NOW() WHERE student_id = $1 AND status = 1`,
      [student_id],
    );

    return {
      status: true,
      message: 'Student deleted successfully',
    };
  }

  async searchStudents(keyword: string, page?: number, limit?: number) {
    const params: any[] = [`%${keyword}%`]; // for ILIKE search

    let query = `
    SELECT
      s.student_id,
      s.branch_id,
      b.branch_name,
      s.roll_number,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      b.branch_name,
      c.class_name,
      sec.section_name,
      TO_CHAR(s.dob, 'DD-MM-YYYY') AS dob,
      s.email AS student_email,
      s.gender,
      s.student_aadhar,
      s.admission_number,
      CASE WHEN s.is_ews = true THEN 'Yes' ELSE 'No' END AS is_ews,
      s.address,
      CONCAT(p.first_name, ' ', p.last_name) AS parent_name,
      p.contact_number AS parent_contact,
      p.email AS parent_email,
      p.relation AS parent_relation
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.class_id
    LEFT JOIN sections sec ON s.section_id = sec.section_id
    LEFT JOIN branches b ON s.branch_id = b.branch_id
    LEFT JOIN student_parent_mapping spm ON s.student_id = spm.student_id
    LEFT JOIN parents p ON spm.parent_id = p.parent_id
    WHERE s.status = 1
      AND (
        s.first_name ILIKE $1 OR
        b.branch_name ILIKE $1 OR
        s.last_name ILIKE $1 OR
        s.roll_number::text ILIKE $1 OR
        s.admission_number ILIKE $1 OR
        s.email ILIKE $1 OR
        s.student_aadhar ILIKE $1
      )
    ORDER BY s.student_id DESC
  `;

    // Pagination
    if (page && limit) {
      const pNum = Number(page);
      const lNum = Number(limit);
      const offset = (pNum - 1) * lNum;
      query += ` LIMIT $2 OFFSET $3`;
      params.push(lNum, offset);
    }

    const data = await this.dataSource.query(query, params);

    // Total count for search
    const countQuery = `
    SELECT COUNT(*) AS count
    FROM students s
    WHERE s.status = 1
      AND (
        s.first_name ILIKE $1 OR
        s.last_name ILIKE $1 OR
        s.roll_number::text ILIKE $1 OR
        s.admission_number ILIKE $1 OR
        s.email ILIKE $1 OR
        s.student_aadhar ILIKE $1
      )
  `;

    const totalResult = await this.dataSource.query(countQuery, [
      `%${keyword}%`,
    ]);
    const totalRecords = Number(totalResult[0].count);

    return {
      status: true,
      message: page && limit ? 'Paginated Search Results' : 'Search Results',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / Number(limit)) : 1,
    };
  }

  async filterStudents(filters: any, page?: number, limit?: number) {
    const conditions: string[] = [`s.status = 1`];
    const params: any[] = [];
    let paramIndex = 1;

    // ----------- Dynamic Filters -----------

    if (filters.first_name) {
      conditions.push(`LOWER(s.first_name) LIKE $${paramIndex++}`);
      params.push(`%${filters.first_name.toLowerCase()}%`);
    }

    if (filters.last_name) {
      conditions.push(`LOWER(s.last_name) LIKE $${paramIndex++}`);
      params.push(`%${filters.last_name.toLowerCase()}%`);
    }

    // if (filters.roll_number) {
    //   conditions.push(`CAST(s.roll_number AS TEXT) LIKE $${paramIndex++}`);
    //   params.push(`%${filters.roll_number}%`);
    // }

    // if (filters.admission_number) {
    //   conditions.push(`s.admission_number ILIKE $${paramIndex++}`);
    //   params.push(`%${filters.admission_number}%`);
    // }

    if (filters.email) {
      conditions.push(`LOWER(s.email) LIKE $${paramIndex++}`);
      params.push(`%${filters.email.toLowerCase()}%`);
    }

    if (filters.gender) {
      conditions.push(`LOWER(s.gender) = $${paramIndex++}`);
      params.push(filters.gender.toLowerCase());
    }

    // if (filters.student_aadhar) {
    //   conditions.push(`s.student_aadhar LIKE $${paramIndex++}`);
    //   params.push(`%${filters.student_aadhar}%`);
    // }

    if (filters.branch_name) {
      conditions.push(`b.branch_name = $${paramIndex++}`);
      params.push(filters.branch_name);
    }

    if (filters.class_name) {
      conditions.push(`c.class_name = $${paramIndex++}`);
      params.push(filters.class_name);
    }

    if (filters.section_name) {
      conditions.push(`sec.section_name = $${paramIndex++}`);
      params.push(filters.section_name);
    }

    if (filters.is_ews !== undefined) {
      conditions.push(`s.is_ews = $${paramIndex++}`);
      params.push(filters.is_ews);
    }

    // if (filters.from_date) {
    //   conditions.push(`s.created_at >= $${paramIndex++}`);
    //   params.push(filters.from_date);
    // }

    // if (filters.to_date) {
    //   conditions.push(`s.created_at <= $${paramIndex++}`);
    //   params.push(filters.to_date);
    // }

    // -------- Base Query --------

    let query = `
    SELECT
      s.student_id,
      s.roll_number,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      b.branch_name,
      c.class_name,
      sec.section_name,
      TO_CHAR(s.dob, 'DD-MM-YYYY') AS dob,
      s.email AS student_email,
      s.gender,
      s.student_aadhar,
      s.admission_number,
      CASE WHEN s.is_ews = true THEN 'Yes' ELSE 'No' END AS is_ews,
      s.address,
      CONCAT(p.first_name, ' ', p.last_name) AS parent_name,
      p.contact_number AS parent_contact,
      p.email AS parent_email,
      p.relation AS parent_relation
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.class_id
    LEFT JOIN sections sec ON s.section_id = sec.section_id
    LEFT JOIN branches b ON s.branch_id = b.branch_id
    LEFT JOIN student_parent_mapping spm ON s.student_id = spm.student_id
    LEFT JOIN parents p ON spm.parent_id = p.parent_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY s.student_id DESC
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
    FROM students s
    LEFT JOIN branches b ON s.branch_id = b.branch_id
    LEFT JOIN classes c ON s.class_id = c.class_id
    LEFT JOIN sections sec ON s.section_id = sec.section_id
    WHERE ${conditions.join(' AND ')}
  `;

    const totalResult = await this.dataSource.query(countQuery, params);
    const totalRecords = totalResult[0]?.count ?? 0;

    return {
      status: true,
      message: 'Filtered Student Results',
      data,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }
}

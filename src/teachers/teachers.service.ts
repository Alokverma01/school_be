
import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TeachersService {
  constructor(private readonly dataSource: DataSource) { }

  // ---------------- CREATE TEACHER ----------------
  async create(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check duplicate email / phone / aadhaar
      const exists = await queryRunner.query(
        `SELECT teacher_id FROM teachers WHERE email = $1 OR contact_number = $2 OR teacher_aadhaar = $3 LIMIT 1`,
        [data.email, data.contact_number, data.teacher_aadhaar],
      );

      if (exists.length > 0) {
        throw new BadRequestException(
          'Email or Contact Number or Aadhaar already exists',
        );
      }

      // Insert teacher
      const teacherInsert = await queryRunner.query(
        `INSERT INTO teachers
        (branch_id, first_name, last_name, email, contact_number, teacher_aadhaar, 
         experience_years, joining_date, emergency_contact_number, address, 
         expertise_one_id, expertise_two_id,
         status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,NOW(),NOW())
       RETURNING teacher_id`,
        [
          data.branch_id,
          data.first_name,
          data.last_name,
          data.email,
          data.contact_number,
          data.teacher_aadhaar,
          data.experience_years,
          data.joining_date,
          data.emergency_contact_number,
          data.address,
          data.expertise_one_id,
          data.expertise_two_id || null,
        ],
      );

      const teacherId = teacherInsert[0].teacher_id;

      // Insert qualifications
      if (data.qualification && Array.isArray(data.qualification)) {
        for (const q of data.qualification) {
          await queryRunner.query(
            `INSERT INTO teacher_qualifications
            (teacher_id, qualification_type, degree_name, specialization, education_level,
             institute_name, institute_type, institute_address, teaching_eligibility_exam,
             certificate_number, passing_year)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
              teacherId,
              q.qualification_type,
              q.degree_name,
              q.specialization,
              q.education_level,
              q.institute_name,
              q.institute_type,
              q.institute_address,
              q.teaching_eligibility_exam,
              q.certificate_number,
              q.passing_year,
            ],
          );
        }
      }

      await queryRunner.commitTransaction();

      return {
        status: true,
        message: 'Teacher and qualification added successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ---------------- GET ALL TEACHERS ----------------
  async findAll(page?: number, limit?: number) {
    const params: any[] = [];
    let paginationQuery = '';

    if (page && limit) {
      params.push(limit, (page - 1) * limit);
      paginationQuery = `LIMIT $1 OFFSET $2`;
    }

    const teachers = (await this.dataSource.query(
      `
    SELECT 
      t.teacher_id, 
      t.branch_id, 
      b.branch_name,
      t.first_name, 
      t.last_name,
      CONCAT(t.first_name , ' ' ,t.last_name) as teacher_name,
      t.email, 
      t.contact_number,
      t.emergency_contact_number, 
      t.teacher_aadhaar, 
      ms1.subject_name as expertise_one_name,
      ms2.subject_name as expertise_two_name,
      t.experience_years, 
      t.joining_date, 
      t.address
    FROM teachers t 
    LEFT JOIN branches b ON b.branch_id = t.branch_id
    LEFT JOIN master_subjects ms1 ON ms1.id = t.expertise_one_id
    LEFT JOIN master_subjects ms2 ON ms2.id = t.expertise_two_id
    WHERE t.status = 1
    ORDER BY t.teacher_id ASC
    ${paginationQuery}
    `,
      params,
    )) as Array<{ teacher_id: number; qualifications?: any[] }>;

    const teacherIds = teachers.map((t) => t.teacher_id);
    let qualifications: Array<any> = [];

    if (teacherIds.length > 0) {
      qualifications = await this.dataSource.query(
        `SELECT * FROM teacher_qualifications WHERE teacher_id = ANY($1::int[])`,
        [teacherIds],
      );
    }

    teachers.forEach((teacher) => {
      teacher.qualifications = qualifications.filter(
        (q) => q.teacher_id === teacher.teacher_id,
      );
    });

    const totalCountResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM teachers WHERE status = 1`,
    );

    const totalRecords = Number(totalCountResult[0].count);

    return {
      status: true,
      message: 'Teachers fetched successfully',
      data: teachers,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // ---------------- TEACHERS BY BRANCH ----------------
  async findByBranchId(branch_id: number) {
    if (!branch_id) {
      throw new BadRequestException('branch_id is required');
    }

    const data = await this.dataSource.query(
      `
      SELECT teacher_id, CONCAT(first_name,' ',last_name) AS teacher_name
      FROM teachers
      WHERE branch_id=$1 AND status=1
      ORDER BY teacher_id DESC
      `,
      [branch_id],
    );

    return {
      status: true,
      message: data?.length ? 'Teachers fetched' : 'No teachers found in this branch',
      data,
    };
  }

  async findById(teacher_id: number) {
    if (!teacher_id) {
      throw new BadRequestException('teacher_id is required');
    }

    const teacher = await this.dataSource.query(
      `
    SELECT 
      t.teacher_id, t.branch_id, t.first_name, t.last_name, t.email, t.contact_number,
      t.emergency_contact_number, t.teacher_aadhaar, 
      t.expertise_one_id, t.expertise_two_id,
      ms1.subject_name as expertise_one_name,
      ms2.subject_name as expertise_two_name,
      t.experience_years, t.joining_date, t.address
    FROM teachers t
    LEFT JOIN master_subjects ms1 ON ms1.id = t.expertise_one_id
    LEFT JOIN master_subjects ms2 ON ms2.id = t.expertise_two_id
    WHERE t.teacher_id = $1 AND t.status = 1
    `,
      [teacher_id],
    );

    if (!teacher.length) {
      throw new BadRequestException('Teacher not found');
    }

    const teacherData = teacher[0];

    const qualifications = await this.dataSource.query(
      `SELECT * FROM teacher_qualifications WHERE teacher_id = $1`,
      [teacher_id],
    );

    return {
      status: true,
      message: 'Teacher fetched successfully',
      data: {
        ...teacherData,
        teacher_name: `${teacherData.first_name} ${teacherData.last_name}`,
        qualifications,
      },
    };
  }

  async update(teacher_id: number, body: any) {
    if (!teacher_id) throw new BadRequestException('teacher_id is required');

    const teacherExists = await this.dataSource.query(
      `SELECT teacher_id FROM teachers WHERE teacher_id=$1 AND status=1`,
      [teacher_id],
    );

    if (!teacherExists.length) {
      throw new BadRequestException('Teacher not found');
    }

    const {
      branch_id,
      first_name,
      last_name,
      email,
      contact_number,
      emergency_contact_number,
      teacher_aadhaar,
      experience_years,
      joining_date,
      address,
      expertise_one_id,
      expertise_two_id,
      qualification = [],
    } = body;

    await this.dataSource.query(
      `
    UPDATE teachers SET
      branch_id=$1, first_name=$2, last_name=$3, email=$4, 
      contact_number=$5, emergency_contact_number=$6, teacher_aadhaar=$7,
      experience_years=$8, joining_date=$9, address=$10, 
      expertise_one_id=$11, expertise_two_id=$12
    WHERE teacher_id=$13
    `,
      [
        branch_id,
        first_name,
        last_name,
        email,
        contact_number,
        emergency_contact_number,
        teacher_aadhaar,
        experience_years,
        joining_date,
        address,
        expertise_one_id,
        expertise_two_id || null,
        teacher_id,
      ],
    );

    const existingQualifications = await this.dataSource.query(
      `SELECT id FROM teacher_qualifications WHERE teacher_id=$1`,
      [teacher_id],
    );

    const existingIds = existingQualifications.map((q) => q.id);

    for (const q of qualification) {
      if (!q.id || !existingIds.includes(Number(q.id))) {
        continue;
      }

      await this.dataSource.query(
        `
      UPDATE teacher_qualifications SET
        qualification_type=$1, degree_name=$2, specialization=$3,
        education_level=$4, institute_name=$5, institute_type=$6,
        institute_address=$7, teaching_eligibility_exam=$8,
        certificate_number=$9, passing_year=$10
      WHERE id=$11 AND teacher_id=$12
      `,
        [
          q.qualification_type,
          q.degree_name,
          q.specialization,
          q.education_level,
          q.institute_name,
          q.institute_type,
          q.institute_address,
          q.teaching_eligibility_exam,
          q.certificate_number,
          q.passing_year,
          q.id,
          teacher_id,
        ],
      );
    }

    return {
      status: true,
      message: 'Teacher updated successfully',
    };
  }

  // ---------------- DELETE TEACHER ----------------
  async delete(teacher_id: number) {
    await this.dataSource.query(
      `UPDATE teachers SET status = 0 WHERE teacher_id = $1`,
      [teacher_id],
    );

    return { status: true, message: 'Teacher deleted successfully' };
  }

  // ---------------- SEARCH ----------------
  async searchTeachers(keyword: string, page?: number, limit?: number) {
    const search = `%${keyword}%`;
    const params: any[] = [search];
    let paginationQuery = '';

    if (page && limit) {
      params.push(limit, (page - 1) * limit);
      paginationQuery = `LIMIT $2 OFFSET $3`;
    }

    const teachers = (await this.dataSource.query(
      `
    SELECT 
      t.teacher_id,
      t.branch_id,
      b.branch_name,
      t.first_name,
      t.last_name,
      t.email,
      t.contact_number,
      t.emergency_contact_number,
      t.teacher_aadhaar,
      t.expertise_one_id,
      t.expertise_two_id,
      ms1.subject_name as expertise_one_name,
      ms2.subject_name as expertise_two_name,
      t.experience_years,
      t.joining_date,
      t.address
    FROM teachers t
    LEFT JOIN branches b ON b.branch_id = t.branch_id
    LEFT JOIN master_subjects ms1 ON ms1.id = t.expertise_one_id
    LEFT JOIN master_subjects ms2 ON ms2.id = t.expertise_two_id
    WHERE t.status = 1
      AND (
        t.first_name ILIKE $1
        OR b.branch_name ILIKE $1
        OR t.last_name ILIKE $1
        OR t.email ILIKE $1
        OR t.teacher_aadhaar ILIKE $1
        OR ms1.subject_name ILIKE $1
        OR ms2.subject_name ILIKE $1
      )
    ORDER BY t.teacher_id ASC
    ${paginationQuery}
    `,
      params,
    )) as Array<{ teacher_id: number; qualifications?: any[] }>;

    const teacherIds = teachers.map((t) => t.teacher_id);
    let qualifications: any[] = [];

    if (teacherIds.length > 0) {
      qualifications = await this.dataSource.query(
        `SELECT * FROM teacher_qualifications WHERE teacher_id = ANY($1::int[])`,
        [teacherIds],
      );
    }

    teachers.forEach((teacher) => {
      teacher.qualifications = qualifications.filter(
        (q) => q.teacher_id === teacher.teacher_id,
      );
    });

    const countResult = await this.dataSource.query(
      `
    SELECT COUNT(*) 
    FROM teachers t
    LEFT JOIN branches b ON b.branch_id = t.branch_id
    LEFT JOIN master_subjects ms1 ON ms1.id = t.expertise_one_id
    LEFT JOIN master_subjects ms2 ON ms2.id = t.expertise_two_id
    WHERE t.status = 1
      AND (
        t.first_name ILIKE $1
        OR b.branch_name ILIKE $1
        OR t.last_name ILIKE $1
        OR t.email ILIKE $1
        OR t.teacher_aadhaar ILIKE $1
        OR ms1.subject_name ILIKE $1
        OR ms2.subject_name ILIKE $1
      )
    `,
      [search],
    );

    const totalRecords = Number(countResult[0].count);

    return {
      status: true,
      message: 'Teachers fetched successfully',
      data: teachers,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterTeachers(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE t.status = 1`;
    let idx = 1;

    if (filters.branch_name) {
      conditions += ` AND b.branch_name = $${idx++}`;
      params.push(filters.branch_name);
    }

    if (filters.expertise) {
      conditions += ` AND (t.expertise_one_id = $${idx} OR t.expertise_two_id = $${idx++})`;
      params.push(filters.expertise);
    }

    if (filters.min_experience) {
      conditions += ` AND t.experience_years >= $${idx++}`;
      params.push(filters.min_experience);
    }

    if (filters.max_experience) {
      conditions += ` AND t.experience_years <= $${idx++}`;
      params.push(filters.max_experience);
    }

    if (filters.from_joining_date) {
      conditions += ` AND t.joining_date >= $${idx++}`;
      params.push(filters.from_joining_date);
    }

    if (filters.to_joining_date) {
      conditions += ` AND t.joining_date <= $${idx++}`;
      params.push(filters.to_joining_date);
    }

    let pagination = '';
    if (page && limit) {
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, (page - 1) * limit);
    }

    const teachers = (await this.dataSource.query(
      `
    SELECT 
      t.teacher_id,
      t.branch_id,
      b.branch_name,
      t.first_name,
      t.last_name,
      t.email,
      t.contact_number,
      t.emergency_contact_number,
      t.teacher_aadhaar,
      t.expertise_one_id,
      t.expertise_two_id,
      ms1.subject_name as expertise_one_name,
      ms2.subject_name as expertise_two_name,
      t.experience_years,
      t.joining_date,
      t.address
    FROM teachers t
    LEFT JOIN branches b ON b.branch_id = t.branch_id
    LEFT JOIN master_subjects ms1 ON ms1.id = t.expertise_one_id
    LEFT JOIN master_subjects ms2 ON ms2.id = t.expertise_two_id
    ${conditions}
    ORDER BY t.teacher_id ASC
    ${pagination}
    `,
      params,
    )) as Array<{ teacher_id: number; qualifications?: any[] }>;

    const teacherIds = teachers.map((t) => t.teacher_id);
    let qualifications: any[] = [];

    if (teacherIds.length > 0) {
      qualifications = await this.dataSource.query(
        `SELECT * FROM teacher_qualifications WHERE teacher_id = ANY($1::int[])`,
        [teacherIds],
      );
    }

    teachers.forEach((teacher) => {
      teacher.qualifications = qualifications.filter(
        (q) => q.teacher_id === teacher.teacher_id,
      );
    });

    const countQuery = `
    SELECT COUNT(*) 
    FROM teachers t
    LEFT JOIN branches b ON b.branch_id = t.branch_id
    ${conditions}
  `;

    const countParams = params.slice(
      0,
      params.length - (page && limit ? 2 : 0),
    );

    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Teachers filtered successfully',
      data: teachers,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // ---------------- FIND BY SUBJECT ID ----------------
  async findBySubjectId(branch_id: number, subject_id: number, page?: number, limit?: number) {
    if (!subject_id || !branch_id) {
      throw new BadRequestException('subject_id and branch_id are required');
    }

    const params: any[] = [branch_id,subject_id];
    let paginationQuery = '';

    if (page && limit) {
      params.push(limit, (page - 1) * limit);
      paginationQuery = `LIMIT $2 OFFSET $3`;
    }

    const teachers = (await this.dataSource.query(
      `
    SELECT 
      t.teacher_id, 
      t.branch_id, 
      b.branch_name,
      CONCAT(t.first_name , ' ' ,t.last_name) as teacher_name,
      ms1.subject_name as expertise_one_name,
      ms2.subject_name as expertise_two_name
    FROM teachers t 
    LEFT JOIN branches b ON b.branch_id = t.branch_id
    LEFT JOIN master_subjects ms1 ON ms1.id = t.expertise_one_id
    LEFT JOIN master_subjects ms2 ON ms2.id = t.expertise_two_id
    WHERE b.branch_id = $1 AND t.status = 1 AND (t.expertise_one_id = $2 OR t.expertise_two_id = $2)
    ORDER BY t.teacher_id ASC
    ${paginationQuery}
    `,
      params,
    )) as Array<{ teacher_id: number; qualifications?: any[] }>;

    const totalRecordsResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM teachers t
      LEFT JOIN branches b ON b.branch_id = t.branch_id
      WHERE b.branch_id = $1 AND t.status = 1 AND (expertise_one_id = $2 OR expertise_two_id = $2)`,
      params
    );

    const totalRecords = Number(totalRecordsResult[0].count);

    return {
      status: true,
      message: 'Teachers by subject fetched successfully',
      data: teachers,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // ---------------- FIND BY BRANCH, CLASS, SUBJECT ----------------
  async findByBranchClassSubject(
    branch_id: number,
    class_id: number,
    subject_id: number,
  ) {
    if (!branch_id || !class_id || !subject_id) {
      throw new BadRequestException(
        'Branch, Class and Subject IDs are required',
      );
    }

    const data = await this.dataSource.query(
      `
      SELECT 
        ts.teacher_id, 
        CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
        sub.id,
        ms.id as master_subject_id,
        ms.subject_name
      FROM teacher_subjects_allocation ts
      LEFT JOIN teachers t ON t.teacher_id = ts.teacher_id
      LEFT JOIN subjects sub ON sub.id = ts.subject_id
      LEFT JOIN master_subjects ms ON ms.id = sub.master_subject_id
      WHERE ts.branch_id = $1 
        AND ts.class_id = $2 
        AND ts.subject_id = $3 
        AND ts.status = 1
        AND t.status = 1
      ORDER BY t.first_name ASC
      `,
      [branch_id, class_id, subject_id],
    );

    return {
      status: true,
      message: data.length > 0 ? 'Teachers fetched successfully' : 'No teachers found for this criteria',
      data,
    };
  }
}
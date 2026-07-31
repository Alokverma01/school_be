import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MarkTeacherAttendanceDto, MarkStudentAttendanceDto } from './mark_attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private dataSource: DataSource) { }

  // Mark Teacher Attendance
  async markTeacherAttendance(dto: MarkTeacherAttendanceDto) {
    const now = new Date();
    const attendanceDate = dto.date || now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss

    // Validate branch exists
    const branch = await this.dataSource.query(
      `SELECT branch_id FROM branches WHERE branch_id = $1 AND status = 1`,
      [dto.branch_id]
    );

    if (branch.length === 0) {
      throw new BadRequestException('Branch not found');
    }

    // Validate teacher exists
    const teacher = await this.dataSource.query(
      `SELECT teacher_id FROM teachers WHERE teacher_id = $1 AND status = 1`,
      [dto.teacher_id]
    );

    if (teacher.length === 0) {
      throw new BadRequestException('Teacher not found');
    }

    // Check if attendance already marked for this date
    const exist = await this.dataSource.query(
      `SELECT id FROM teacher_attendance 
       WHERE teacher_id = $1 AND date = $2 AND status = 1`,
      [dto.teacher_id, attendanceDate]
    );

    if (exist.length > 0) {
      throw new BadRequestException('Attendance already marked for this date');
    }

    // Auto-calculate attendance status based on time if not provided
    let attendanceStatus = dto.attendance_status;
    let checkInTime = dto.check_in;

    if (attendanceStatus === undefined) {
      let comparisonTime: Date;
      if (checkInTime) {
        const [hours, minutes] = checkInTime.split(':').map(Number);
        comparisonTime = new Date();
        comparisonTime.setHours(hours, minutes, 0, 0);
      } else {
        comparisonTime = now;
        // If it's a normal marking (not explicitly absent), auto-set check-in
        checkInTime = currentTimeStr;
      }

      const cutoffTime = new Date();
      cutoffTime.setHours(8, 30, 0, 0); // 8:30 AM cutoff

      attendanceStatus = comparisonTime > cutoffTime ? 2 : 1; // 2 = late, 1 = present
    } else if (attendanceStatus === 1 || attendanceStatus === 2) {
      // If marking as present/late manually but without check_in, use current time
      if (!checkInTime) checkInTime = currentTimeStr;
    }

    // Insert attendance
    await this.dataSource.query(
      `INSERT INTO teacher_attendance (branch_id, teacher_id, date, attendance_status, check_in, check_out, status)
       VALUES ($1, $2, $3, $4, $5, $6, 1)`,
      [
        dto.branch_id,
        dto.teacher_id,
        attendanceDate,
        attendanceStatus,
        checkInTime || null,
        dto.check_out || null
      ]
    );

    const statusText = attendanceStatus === 0 ? 'absent' : attendanceStatus === 1 ? 'present' : 'late';

    return {
      status: true,
      message: `Teacher attendance marked as ${statusText}`,
      data: {
        teacher_id: dto.teacher_id,
        date: attendanceDate,
        attendance_status: attendanceStatus,
        check_in: checkInTime
      },
    };
  }

  // Teacher Check-out
  async teacherCheckOut(dto: { branch_id: number; teacher_id: number }) {
    const now = new Date();
    const attendanceDate = now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().split(' ')[0];

    // Find attendance record for today
    const attendance = await this.dataSource.query(
      `SELECT id, check_out FROM teacher_attendance 
       WHERE teacher_id = $1 AND branch_id = $2 AND date = $3 AND status = 1`,
      [dto.teacher_id, dto.branch_id, attendanceDate]
    );

    if (attendance.length === 0) {
      throw new BadRequestException('No attendance record found for today. Please mark check-in first.');
    }

    if (attendance[0].check_out) {
      throw new BadRequestException('Teacher already checked out for today.');
    }

    // Update check-out time
    await this.dataSource.query(
      `UPDATE teacher_attendance SET check_out = $1, updated_at = NOW() WHERE id = $2`,
      [currentTimeStr, attendance[0].id]
    );

    return {
      status: true,
      message: 'Teacher checked out successfully',
      data: {
        check_out: currentTimeStr
      }
    };
  }

  // Mark Student Attendance (only by teacher)
  async markStudentAttendance(dto: MarkStudentAttendanceDto) {
    const attendanceDate = dto.date || new Date().toISOString().split('T')[0];

    // Validate branch exists
    const branch = await this.dataSource.query(
      `SELECT branch_id FROM branches WHERE branch_id = $1 AND status = 1`,
      [dto.branch_id]
    );

    if (branch.length === 0) {
      throw new BadRequestException('Branch not found');
    }

    // Validate student exists in the specified branch/class/section
    const student = await this.dataSource.query(
      `SELECT student_id FROM students 
       WHERE student_id = $1 AND branch_id = $2 AND class_id = $3 AND section_id = $4 AND status = 1`,
      [dto.student_id, dto.branch_id, dto.class_id, dto.section_id]
    );

    if (student.length === 0) {
      throw new BadRequestException('Student not found in the specified branch/class/section');
    }

    // Check if attendance already marked for this date
    const exist = await this.dataSource.query(
      `SELECT id FROM student_attendance 
       WHERE student_id = $1 AND date = $2 AND status = 1`,
      [dto.student_id, attendanceDate]
    );

    if (exist.length > 0) {
      throw new BadRequestException('Attendance already marked for this date');
    }

    // Auto-calculate attendance status based on time if not provided
    let attendanceStatus = dto.attendance_status;
    if (attendanceStatus === undefined) {
      const currentTime = new Date();
      const cutoffTime = new Date();
      cutoffTime.setHours(8, 30, 0, 0); // 8:30 AM cutoff

      attendanceStatus = currentTime > cutoffTime ? 2 : 1; // 2 = late, 1 = present
    }

    // Insert attendance
    await this.dataSource.query(
      `INSERT INTO student_attendance (branch_id, class_id, section_id, student_id, date, attendance_status, status)
       VALUES ($1, $2, $3, $4, $5, $6, 1)`,
      [dto.branch_id, dto.class_id, dto.section_id, dto.student_id, attendanceDate, attendanceStatus]
    );

    const statusText = attendanceStatus === 0 ? 'absent' : attendanceStatus === 1 ? 'present' : 'late';

    return {
      status: true,
      message: `Student attendance marked as ${statusText}`,
      data: {
        student_id: dto.student_id,
        date: attendanceDate,
        attendance_status: attendanceStatus,
      },
    };
  }

  // Get Teacher Attendance
  async getTeacherAttendance(
    teacher_id?: number,
    branch_id?: number,
    page?: number,
    limit?: number,
    date?: string,
  ) {
    let query = `
      SELECT 
        a.id,
        a.branch_id,
        b.branch_name,
        a.teacher_id,
        CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
        a.date,
        a.attendance_status,
        CASE 
          WHEN a.attendance_status = 0 THEN 'Absent'
          WHEN a.attendance_status = 1 THEN 'Present'
          WHEN a.attendance_status = 2 THEN 'Late'
        END AS status_text,
        a.check_in,
        a.check_out
      FROM teacher_attendance a
      LEFT JOIN teachers t ON t.teacher_id = a.teacher_id
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      WHERE a.status = 1
    `;

    const params: any[] = [];
    let idx = 1;

    if (teacher_id) {
      query += ` AND a.teacher_id = $${idx++}`;
      params.push(teacher_id);
    }

    if (branch_id) {
      query += ` AND a.branch_id = $${idx++}`;
      params.push(branch_id);
    }

    if (date) {
      query += ` AND a.date = $${idx++}`;
      params.push(date);
    }

    query += ` ORDER BY a.date DESC, a.id DESC`;

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(query, params);

    // Count total records
    let countQuery = `SELECT COUNT(*) FROM teacher_attendance WHERE status = 1`;
    const countParams: any[] = [];
    let countIdx = 1;

    if (teacher_id) {
      countQuery += ` AND teacher_id = $${countIdx++}`;
      countParams.push(teacher_id);
    }

    if (branch_id) {
      countQuery += ` AND branch_id = $${countIdx++}`;
      countParams.push(branch_id);
    }

    if (date) {
      countQuery += ` AND date = $${countIdx++}`;
      countParams.push(date);
    }

    const countResult = await this.dataSource.query(countQuery, countParams);
    const totalRecords = parseInt(countResult[0].count, 10);

    return {
      status: true,
      message: 'Teacher attendance fetched successfully',
      data,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // Get Student Attendance
  async getStudentAttendance(
    student_id?: number,
    branch_id?: number,
    class_id?: number,
    section_id?: number,
    page?: number,
    limit?: number,
    date?: string,
  ) {
    let query = `
      SELECT 
        a.id,
        a.branch_id,
        b.branch_name,
        a.class_id,
        c.class_name,
        a.section_id,
        sec.section_name,
        a.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        a.date,
        a.attendance_status,
        CASE 
          WHEN a.attendance_status = 0 THEN 'Absent'
          WHEN a.attendance_status = 1 THEN 'Present'
          WHEN a.attendance_status = 2 THEN 'Late'
        END AS status_text
      FROM student_attendance a
      LEFT JOIN students s ON s.student_id = a.student_id
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      LEFT JOIN classes c ON c.class_id = a.class_id
      LEFT JOIN sections sec ON sec.section_id = a.section_id
      WHERE a.status = 1
    `;

    const params: any[] = [];
    let idx = 1;

    if (student_id) {
      query += ` AND a.student_id = $${idx++}`;
      params.push(student_id);
    }

    if (branch_id) {
      query += ` AND a.branch_id = $${idx++}`;
      params.push(branch_id);
    }

    if (class_id) {
      query += ` AND a.class_id = $${idx++}`;
      params.push(class_id);
    }

    if (section_id) {
      query += ` AND a.section_id = $${idx++}`;
      params.push(section_id);
    }

    if (date) {
      query += ` AND a.date = $${idx++}`;
      params.push(date);
    }

    query += ` ORDER BY a.date DESC, a.id DESC`;

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(query, params);

    // Count total records
    let countQuery = `SELECT COUNT(*) FROM student_attendance WHERE status = 1`;
    const countParams: any[] = [];
    let countIdx = 1;

    if (student_id) {
      countQuery += ` AND student_id = $${countIdx++}`;
      countParams.push(student_id);
    }

    if (branch_id) {
      countQuery += ` AND branch_id = $${countIdx++}`;
      countParams.push(branch_id);
    }

    if (class_id) {
      countQuery += ` AND class_id = $${countIdx++}`;
      countParams.push(class_id);
    }

    if (section_id) {
      countQuery += ` AND section_id = $${countIdx++}`;
      countParams.push(section_id);
    }

    if (date) {
      countQuery += ` AND date = $${countIdx++}`;
      countParams.push(date);
    }

    const countResult = await this.dataSource.query(countQuery, countParams);
    const totalRecords = parseInt(countResult[0].count, 10);

    return {
      status: true,
      message: 'Student attendance fetched successfully',
      data,
      totalRecords,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // Search Teacher Attendance
  async searchTeacherAttendance(
    keyword: string,
    branch_id?: number,
    page?: number,
    limit?: number,
  ) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];
    let idx = 2;

    let conditions = `WHERE a.status = 1`;

    if (branch_id) {
      conditions += ` AND a.branch_id = $${idx++}`;
      params.push(branch_id);
    }

    let pagination = '';
    if (page && limit) {
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, (page - 1) * limit);
    }

    const query = `
      SELECT 
        a.id,
        a.branch_id,
        b.branch_name,
        a.teacher_id,
        CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
        a.date,
        a.attendance_status,
        CASE 
          WHEN a.attendance_status = 0 THEN 'absent'
          WHEN a.attendance_status = 1 THEN 'present'
          WHEN a.attendance_status = 2 THEN 'late'
        END AS status_text,
        a.check_in,
        a.check_out
      FROM teacher_attendance a
      LEFT JOIN teachers t ON t.teacher_id = a.teacher_id
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      ${conditions}
        AND (
          CONCAT(t.first_name, ' ', t.last_name) ILIKE $1
          OR b.branch_name ILIKE $1
          OR TO_CHAR(a.date, 'YYYY-MM-DD') ILIKE $1
        )
      ORDER BY a.date DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    // Count query
    const countQuery = `
      SELECT COUNT(*)
      FROM teacher_attendance a
      LEFT JOIN teachers t ON t.teacher_id = a.teacher_id
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      ${conditions}
        AND (
          CONCAT(t.first_name, ' ', t.last_name) ILIKE $1
          OR b.branch_name ILIKE $1
          OR TO_CHAR(a.date, 'YYYY-MM-DD') ILIKE $1
        )
    `;

    const countParams = params.slice(0, page && limit ? params.length - 2 : params.length);
    const countResult = await this.dataSource.query(countQuery, countParams);
    const totalRecords = Number(countResult[0].count);

    return {
      status: true,
      message: 'Teacher attendance search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  // Search Student Attendance
  async searchStudentAttendance(
    keyword: string,
    branch_id?: number,
    class_id?: number,
    section_id?: number,
    page?: number,
    limit?: number,
  ) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];
    let idx = 2;

    let conditions = `WHERE a.status = 1`;

    if (branch_id) {
      conditions += ` AND a.branch_id = $${idx++}`;
      params.push(branch_id);
    }

    if (class_id) {
      conditions += ` AND a.class_id = $${idx++}`;
      params.push(class_id);
    }

    if (section_id) {
      conditions += ` AND a.section_id = $${idx++}`;
      params.push(section_id);
    }

    let pagination = '';
    if (page && limit) {
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, (page - 1) * limit);
    }

    const query = `
      SELECT 
        a.id,
        a.branch_id,
        b.branch_name,
        a.class_id,
        c.class_name,
        a.section_id,
        sec.section_name,
        a.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        a.date,
        a.attendance_status,
        CASE 
          WHEN a.attendance_status = 0 THEN 'absent'
          WHEN a.attendance_status = 1 THEN 'present'
          WHEN a.attendance_status = 2 THEN 'late'
        END AS status_text
      FROM student_attendance a
      LEFT JOIN students s ON s.student_id = a.student_id
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      LEFT JOIN classes c ON c.class_id = a.class_id
      LEFT JOIN sections sec ON sec.section_id = a.section_id
      ${conditions}
        AND (
          CONCAT(s.first_name, ' ', s.last_name) ILIKE $1
          OR b.branch_name ILIKE $1
          OR c.class_name ILIKE $1
          OR sec.section_name ILIKE $1
          OR TO_CHAR(a.date, 'YYYY-MM-DD') ILIKE $1
        )
      ORDER BY a.date DESC
      ${pagination}
    `;

    const data = await this.dataSource.query(query, params);

    // Count query
    const countQuery = `
      SELECT COUNT(*)
      FROM student_attendance a
      LEFT JOIN students s ON s.student_id = a.student_id
      LEFT JOIN branches b ON b.branch_id = a.branch_id
      LEFT JOIN classes c ON c.class_id = a.class_id
      LEFT JOIN sections sec ON sec.section_id = a.section_id
      ${conditions}
        AND (
          CONCAT(s.first_name, ' ', s.last_name) ILIKE $1
          OR b.branch_name ILIKE $1
          OR c.class_name ILIKE $1
          OR sec.section_name ILIKE $1
          OR TO_CHAR(a.date, 'YYYY-MM-DD') ILIKE $1
        )
    `;

    const countParams = params.slice(0, page && limit ? params.length - 2 : params.length);
    const countResult = await this.dataSource.query(countQuery, countParams);
    const totalRecords = Number(countResult[0].count);

    return {
      status: true,
      message: 'Student attendance search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }
}

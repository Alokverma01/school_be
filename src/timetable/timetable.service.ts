import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TimetableService {
  constructor(private readonly dataSource: DataSource) { }

  // CREATE OR UPDATE (Upsert based on Class/Section/Year)
  async create(body: any) {
    const {
      branch_id,
      class_id,
      section_id,
      academic_year,
      periods, // Object: { Mon: [], Tue: [], ... }
      subject_id,
      teacher_id,
      room_id,
      start_time,
      end_time,
      day_of_week,
      period_number,
      period_type,
    } = body;

    let finalPeriods = periods;
    if (!finalPeriods && subject_id && teacher_id && room_id && start_time && end_time && day_of_week && period_number !== undefined && period_type) {
      finalPeriods = {
        [day_of_week]: [
          {
            subject_id,
            teacher_id,
            room_id,
            start_time,
            end_time,
            period_number,
            period_type,
          },
        ],
      };
    }

    if (!branch_id || !class_id || !section_id || !finalPeriods) {
      throw new BadRequestException('Missing required fields or invalid periods');
    }

    // --- Teacher Conflict Validation ---
    await this.validateTeacherConflicts(periods, academic_year, class_id, section_id);

    // --- Upsert Logic ---
    const existing = await this.dataSource.query(
      `SELECT id FROM timetable WHERE class_id = $1 AND section_id = $2 AND academic_year = $3 AND status = 1`,
      [class_id, section_id, academic_year],
    );

    if (existing.length > 0) {
      await this.dataSource.query(
        `UPDATE timetable 
         SET branch_id = $1, periods = $2, updated_at = NOW() 
         WHERE id = $3`,
        [branch_id, JSON.stringify(periods), existing[0].id],
      );
    } else {
      await this.dataSource.query(
        `INSERT INTO timetable (branch_id, class_id, section_id, academic_year, periods) 
         VALUES ($1, $2, $3, $4, $5)`,
        [branch_id, class_id, section_id, academic_year, JSON.stringify(periods)],
      );
    }

    return { status: true, message: 'Timetable saved successfully' };
  }

  // UPDATE BY ID
  async update(id: number, body: any) {
    if (!id) throw new BadRequestException('Timetable ID is required');

    const existingResult = await this.dataSource.query(
      `SELECT * FROM timetable WHERE id = $1 AND status = 1`,
      [id],
    );

    if (existingResult.length === 0) {
      throw new NotFoundException('Timetable not found');
    }

    const existing = existingResult[0];
    const {
      branch_id,
      class_id,
      section_id,
      academic_year,
      periods,
    } = body;

    const finalClassId = class_id || existing.class_id;
    const finalSectionId = section_id || existing.section_id;
    const finalYear = academic_year || existing.academic_year;

    if (periods) {
      await this.validateTeacherConflicts(periods, finalYear, finalClassId, finalSectionId, id);
    }

    await this.dataSource.query(
      `UPDATE timetable 
       SET 
         branch_id = COALESCE($1, branch_id),
         class_id = COALESCE($2, class_id),
         section_id = COALESCE($3, section_id),
         academic_year = COALESCE($4, academic_year),
         periods = COALESCE($5, periods),
         updated_at = NOW() 
       WHERE id = $6`,
      [
        branch_id || null,
        class_id || null,
        section_id || null,
        academic_year || null,
        periods ? JSON.stringify(periods) : null,
        id
      ],
    );

    return { status: true, message: 'Timetable updated successfully' };
  }

  // SEARCH
  async search(keyword: string, page?: number, limit?: number) {
    let query = `
      SELECT t.id,
      b.branch_name,
      c.class_name,
      sec.section_name,
      t.academic_year,
      t.periods
      FROM timetable t
      LEFT JOIN branches b ON t.branch_id = b.branch_id
      LEFT JOIN classes c ON t.class_id = c.class_id
      LEFT JOIN sections sec ON t.section_id = sec.section_id
      WHERE t.status = 1 AND (
        b.branch_name ILIKE $1 OR 
        c.class_name ILIKE $1 OR 
        sec.section_name ILIKE $1 OR
        t.academic_year ILIKE $1
      )
      ORDER BY t.id DESC
    `;

    const params: any[] = [`%${keyword}%`];
    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(query, params);
    const enrichedData = await this.enrichTimetableDetails(data);

    const countQuery = `
      SELECT COUNT(*) 
      FROM timetable t
      LEFT JOIN branches b ON t.branch_id = b.branch_id
      LEFT JOIN classes c ON t.class_id = c.class_id
      LEFT JOIN sections sec ON t.section_id = sec.section_id
      WHERE t.status = 1 AND (
        b.branch_name ILIKE $1 OR 
        c.class_name ILIKE $1 OR 
        sec.section_name ILIKE $1 OR
        t.academic_year ILIKE $1
      )
    `;
    const totalCount = await this.dataSource.query(countQuery, [`%${keyword}%`]);

    return {
      status: true,
      data: enrichedData,
      totalRecords: +totalCount[0].count,
    };
  }

  // FILTER
  async filter(filters: any, page?: number, limit?: number) {
    const { branch_name, class_name, section_name, academic_year } = filters;
    let whereClause = `WHERE t.status = 1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (branch_name) {
      whereClause += ` AND b.branch_name = $${paramIndex++}`;
      params.push(branch_name);
    }
    if (class_name) {
      whereClause += ` AND c.class_name = $${paramIndex++}`;
      params.push(class_name);
    }
    if (section_name) {
      whereClause += ` AND sec.section_name = $${paramIndex++}`;
      params.push(section_name);
    }
    if (academic_year) {
      whereClause += ` AND t.academic_year = $${paramIndex++}`;
      params.push(academic_year);
    }

    let query = `
      SELECT t.id,
      b.branch_name,
      c.class_name,
      sec.section_name,
      t.academic_year,
      t.periods
      FROM timetable t
      LEFT JOIN branches b ON t.branch_id = b.branch_id
      LEFT JOIN classes c ON t.class_id = c.class_id
      LEFT JOIN sections sec ON t.section_id = sec.section_id
      ${whereClause}
      ORDER BY t.id DESC
    `;

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(query, params);
    const enrichedData = await this.enrichTimetableDetails(data);

    const countQuery = `SELECT COUNT(*) FROM timetable t 
    LEFT JOIN branches b ON t.branch_id = b.branch_id
    LEFT JOIN classes c ON t.class_id = c.class_id
    LEFT JOIN sections sec ON t.section_id = sec.section_id
    ${whereClause}`;
    const totalCount = await this.dataSource.query(countQuery, params.slice(0, paramIndex - (page && limit ? 3 : 1)));

    return {
      status: true,
      data: enrichedData,
      totalRecords: +totalCount[0].count,
    };
  }

  // GET ALL
  async findAll(page?: number, limit?: number) {
    let query = `
      SELECT 
        t.id,
        t.branch_id,
        b.branch_name,
        t.class_id,
        c.class_name,
        t.section_id,
        sec.section_name,
        t.academic_year,
        t.periods
      FROM timetable t
      LEFT JOIN branches b ON t.branch_id = b.branch_id
      LEFT JOIN classes c ON t.class_id = c.class_id
      LEFT JOIN sections sec ON t.section_id = sec.section_id
      WHERE t.status = 1
      ORDER BY t.id DESC
    `;

    const params: any[] = [];
    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const rawData = await this.dataSource.query(query, params);
    const data = await this.enrichTimetableDetails(rawData);

    const totalCount = await this.dataSource.query(`SELECT COUNT(*) FROM timetable WHERE status = 1`);

    return {
      status: true,
      message: 'Timetable fetched successfully',
      data,
      totalRecords: +totalCount[0].count,
    };
  }

  // GET ONE
  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('timetable id is required');
    }

    const query = `
      SELECT 
      t.id,
      t.branch_id,
      b.branch_name,
      t.class_id,
      c.class_name,
      t.section_id,
      sec.section_name,
      t.academic_year,
      t.periods
      FROM timetable t
      LEFT JOIN branches b ON t.branch_id = b.branch_id
      LEFT JOIN classes c ON t.class_id = c.class_id
      LEFT JOIN sections sec ON t.section_id = sec.section_id
      WHERE t.id = $1 AND t.status = 1
    `;
    const result = await this.dataSource.query(query, [id]);

    if (!result.length) {
      throw new NotFoundException('Timetable not found');
    }

    const enriched = await this.enrichTimetableDetails(result);
    return { status: true, data: enriched[0] };
  }

  // DELETE
  async delete(id: number) {
    await this.dataSource.query(`UPDATE timetable SET status = 0 WHERE id = $1`, [id]);
    return { status: true, message: 'Timetable removed' };
  }

  // Find by Class/Section for prefill
  async findByClassAndSection(class_id: number, section_id: number, academic_year: string) {
    const result = await this.dataSource.query(
      `SELECT * FROM timetable WHERE class_id = $1 AND section_id = $2 AND academic_year = $3 AND status = 1`,
      [class_id, section_id, academic_year],
    );

    if (result.length > 0) {
      const enriched = await this.enrichTimetableDetails(result);
      return { status: true, data: enriched[0] };
    }

    return { status: false, message: 'No timetable found' };
  }

  // --- Private Validation Helper ---
  private async validateTeacherConflicts(periods: any, academic_year: string, class_id: number, section_id: number, excludeId?: number) {
    for (const [day, slots] of Object.entries(periods)) {
      if (!Array.isArray(slots)) continue;

      for (const slot of slots as any[]) {
        const { teacher_id, start_time, end_time } = slot;
        if (!teacher_id || !start_time || !end_time) continue;

        const conflict = await this.dataSource.query(
          `
          SELECT t.id, c.class_name, s.section_name
          FROM timetable t
          JOIN classes c ON c.class_id = t.class_id
          JOIN sections s ON s.section_id = t.section_id,
          jsonb_array_elements(COALESCE(t.periods-> $1, '[]'::jsonb)) AS slot_data
          WHERE t.status = 1
            AND t.academic_year = $2
            AND (t.class_id != $3 OR t.section_id != $4)
            ${excludeId ? 'AND t.id != $8' : ''}
            AND (slot_data->>'teacher_id')::int = $5
            AND (
              ((slot_data->>'start_time')::time <= $6::time AND (slot_data->>'end_time')::time > $6::time) OR
              ((slot_data->>'start_time')::time < $7::time AND (slot_data->>'end_time')::time >= $7::time) OR
              ((slot_data->>'start_time')::time >= $6::time AND (slot_data->>'end_time')::time <= $7::time)
            )
          LIMIT 1
          `,
          excludeId
            ? [day, academic_year, class_id, section_id, teacher_id, start_time, end_time, excludeId]
            : [day, academic_year, class_id, section_id, teacher_id, start_time, end_time],
        );

        if (conflict.length > 0) {
          throw new BadRequestException(
            `Teacher conflict: The teacher is already assigned to ${conflict[0].class_name} - ${conflict[0].section_name} on ${day} between ${start_time} and ${end_time}`
          );
        }
      }
    }
  }

  // --- Helper to Enrich JSONB Periods with Names ---
  private async enrichTimetableDetails(records: any[]) {
    if (!records || records.length === 0) return [];

    // 1. Collect all unique Teacher and Subject IDs
    const teacherIds = new Set<number>();
    const subjectIds = new Set<number>();

    for (const record of records) {
      if (record.periods) {
        for (const daySlots of Object.values(record.periods)) {
          if (Array.isArray(daySlots)) {
            for (const slot of daySlots) {
              if (slot.teacher_id) teacherIds.add(Number(slot.teacher_id));
              if (slot.subject_id) subjectIds.add(Number(slot.subject_id));
            }
          }
        }
      }
    }

    // 2. Fetch Names in Bulk
    const teachersMap = new Map<number, string>();
    if (teacherIds.size > 0) {
      const teachers = await this.dataSource.query(
        `SELECT teacher_id, first_name, last_name FROM teachers WHERE teacher_id IN (${Array.from(teacherIds).join(',')})`
      );
      teachers.forEach(t => teachersMap.set(t.teacher_id, `${t.first_name} ${t.last_name}`));
    }

    const subjectsMap = new Map<number, string>();
    if (subjectIds.size > 0) {
      const subjects = await this.dataSource.query(
        `
        SELECT s.id, ms.subject_name as name
        FROM subjects s
        LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
        WHERE s.id IN (${Array.from(subjectIds).join(',')})
        `
      );
      subjects.forEach(s => subjectsMap.set(s.id, s.name));
    }

    // 3. Map Names Back to JSON
    for (const record of records) {
      if (record.periods) {
        for (const day of Object.keys(record.periods)) {
          record.periods[day] = record.periods[day].map((slot: any) => ({
            ...slot,
            teacher_name: teachersMap.get(Number(slot.teacher_id)) || 'Unknown',
            subject_name: subjectsMap.get(Number(slot.subject_id)) || 'Unknown'
          }));
        }
      }
    }

    return records;
  }
}

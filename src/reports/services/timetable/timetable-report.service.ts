import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TimetableReportService {
    constructor(private readonly dataSource: DataSource) { }

    async getClassTimetableReport(branch_id: number, class_id: number, section_id: number, academic_year: string) {
        const timetable = await this.dataSource.query(
            `
      SELECT t.periods, t.branch_id,
      b.branch_name,
      c.class_name,
      s.section_name
      FROM timetable t
      JOIN classes c ON t.class_id = c.class_id
      JOIN sections s ON t.section_id = s.section_id
      JOIN branches b ON t.branch_id = b.branch_id
      WHERE t.branch_id = $1 
        AND t.class_id = $2 
        AND t.section_id = $3 
        AND t.academic_year = $4 
        AND t.status = 1
      LIMIT 1
      `,
            [branch_id, class_id, section_id, academic_year],
        );

        if (timetable.length === 0) {
            throw new NotFoundException('Timetable not found for the specified class and section');
        }

        const periods = timetable[0].periods || {};
        const enrichedPeriods = await this.enrichPeriodsWithNames(periods);

        return {
            status: true,
            data: {
                branch_id,
                branch_name: timetable[0].branch_name,
                class_id,
                class_name: timetable[0].class_name,
                section_id,
                section_name: timetable[0].section_name,
                academic_year,
                timetable: enrichedPeriods
            }
        };
    }

    async getTeacherTimetableReport(branch_id: number, teacher_id: number, academic_year: string) {
        // 1. Fetch all timetables for the branch and academic year
        const allTimetables = await this.dataSource.query(
            `
            SELECT 
                t.id, 
                b.branch_name,
                t.class_id, 
                c.class_name, 
                t.section_id, 
                s.section_name, 
                t.periods 
            FROM timetable t
            JOIN classes c ON t.class_id = c.class_id
            JOIN branches b ON t.branch_id = b.branch_id
            JOIN sections s ON t.section_id = s.section_id
            WHERE t.branch_id = $1 
                AND t.academic_year = $2 
                AND t.status = 1
            `,
            [branch_id, academic_year],
        );

        // 2. Filter and Construct Teacher's Schedule
        const teacherSchedule: Record<string, any[]> = {
            Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
        };

        // Helper to collect subject IDs for batch fetching
        const subjectIds = new Set<number>();

        for (const record of allTimetables) {
            const { class_name, section_name, periods } = record;
            if (!periods) continue;

            for (const [day, slots] of Object.entries(periods)) {
                if (!Array.isArray(slots)) continue;

                // Ensure the day key exists in our schedule (if custom days are used, though we init standard ones)
                if (!teacherSchedule[day]) teacherSchedule[day] = [];

                for (const slot of slots as any[]) {
                    // Check if this slot is assigned to the teacher
                    if (slot.teacher_id && Number(slot.teacher_id) === Number(teacher_id)) {
                        teacherSchedule[day].push({
                            ...slot,
                            class_name,
                            section_name,
                            class_id: record.class_id,
                            section_id: record.section_id
                        });
                        if (slot.subject_id) subjectIds.add(Number(slot.subject_id));
                    }
                }
            }
        }

        // 3. Sort slots by time
        for (const day of Object.keys(teacherSchedule)) {
            teacherSchedule[day].sort((a, b) => {
                return (a.start_time || '').localeCompare(b.start_time || '');
            });
        }

        // 4. Enrich with Subject Names (and Teacher Name for metadata)
        const subjectsMap = await this.getSubjectsMap(Array.from(subjectIds));
        const teacherDetails = await this.dataSource.query(
            `SELECT first_name, last_name FROM teachers WHERE teacher_id = $1`, [teacher_id]
        );
        const teacherName = teacherDetails.length ? `${teacherDetails[0].first_name} ${teacherDetails[0].last_name}` : 'Unknown Teacher';

        // Apply names
        for (const day of Object.keys(teacherSchedule)) {
            teacherSchedule[day] = teacherSchedule[day].map(slot => ({
                ...slot,
                subject_name: subjectsMap.get(Number(slot.subject_id)) || 'Unknown Subject',
                teacher_name: teacherName // Redundant but consistent
            }));
        }

        return {
            status: true,
            data: {
                branch_id,
                branch_name: allTimetables[0].branch_name,
                teacher_id,
                teacher_name: teacherName,
                academic_year,
                timetable: teacherSchedule
            }
        };
    }

    // --- Helpers ---

    private async enrichPeriodsWithNames(periods: any) {
        const teacherIds = new Set<number>();
        const subjectIds = new Set<number>();

        // Collect IDs
        for (const slots of Object.values(periods)) {
            if (Array.isArray(slots)) {
                for (const slot of slots as any[]) {
                    if (slot.teacher_id) teacherIds.add(Number(slot.teacher_id));
                    if (slot.subject_id) subjectIds.add(Number(slot.subject_id));
                }
            }
        }

        // Fetch Maps
        const teachersMap = await this.getTeachersMap(Array.from(teacherIds));
        const subjectsMap = await this.getSubjectsMap(Array.from(subjectIds));

        // Map names
        const enriched = JSON.parse(JSON.stringify(periods)); // Deep copy
        for (const day of Object.keys(enriched)) {
            if (Array.isArray(enriched[day])) {
                enriched[day] = enriched[day].map((slot: any) => ({
                    ...slot,
                    teacher_name: teachersMap.get(Number(slot.teacher_id)) || 'Unknown',
                    subject_name: subjectsMap.get(Number(slot.subject_id)) || 'Unknown'
                }));

                // Sort by start_time
                enriched[day].sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''));
            }
        }

        return enriched;
    }

    private async getTeachersMap(teacherIds: number[]): Promise<Map<number, string>> {
        const map = new Map<number, string>();
        if (teacherIds.length === 0) return map;

        const teachers = await this.dataSource.query(
            `SELECT teacher_id, first_name, last_name FROM teachers WHERE teacher_id IN (${teacherIds.join(',')})`
        );
        teachers.forEach((t: any) => map.set(t.teacher_id, `${t.first_name} ${t.last_name}`));
        return map;
    }

    private async getSubjectsMap(subjectIds: number[]): Promise<Map<number, string>> {
        const map = new Map<number, string>();
        if (subjectIds.length === 0) return map;

        const subjects = await this.dataSource.query(
            `
      SELECT s.id, ms.subject_name as name
      FROM subjects s
      LEFT JOIN master_subjects ms ON ms.id = s.master_subject_id
      WHERE s.id IN (${subjectIds.join(',')})
      `
        );
        subjects.forEach((s: any) => map.set(s.id, s.name));
        return map;
    }
}

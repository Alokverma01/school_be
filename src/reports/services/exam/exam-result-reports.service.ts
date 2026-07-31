import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ExamReportsService {
    constructor(private readonly dataSource: DataSource) { }

    async getExamSchedule(branch_id: number, class_id: number, exam_type?: number, page?: number, limit?: number) {
        if (!branch_id || !class_id) throw new BadRequestException('branch_id and class_id are required');

        const params: any[] = [branch_id, class_id];

        let subQuery = `
            SELECT 
                em.exam_id, 
                em.exam_type, 
                et.exam_type as exam_type_name, 
                em.academic_year, 
                em.start_date, 
                em.end_date, 
                c.class_id,
                c.class_name,
                esm.exam_date,
                esm.start_time,
                esm.end_time,
                esm.max_marks,
                esm.passing_marks,
                ms.subject_name,
                br.branch_name
            FROM exam_subject_mapping esm
            LEFT JOIN exam_master em ON esm.exam_id = em.exam_id AND em.status = 1
            LEFT JOIN branches br ON em.branch_id = br.branch_id
            LEFT JOIN exam_types et ON em.exam_type = et.exam_type_id
            LEFT JOIN classes c ON c.class_id = $2 AND c.status = 1
            LEFT JOIN subjects s ON esm.subject_id = s.id AND s.class_id = c.class_id AND s.status = 1
            LEFT JOIN master_subjects ms ON s.master_subject_id = ms.id AND ms.status = 1
            WHERE em.branch_id = $1 
              AND esm.status = 1
        `;

        if (exam_type) {
            subQuery += ` AND em.exam_type = $3`;
            params.push(exam_type);
        }

        const baseGroupQuery = `
            SELECT 
                exam_id, exam_type, exam_type_name, academic_year, 
                start_date, end_date, class_id, class_name, 
                subject_name, exam_date, start_time, end_time, 
                max_marks, passing_marks, branch_name
            FROM (${subQuery}) as sub
            GROUP BY 
                exam_id, exam_type, exam_type_name, academic_year, 
                start_date, end_date, class_id, class_name, 
                subject_name, exam_date, start_time, end_time, 
                max_marks, passing_marks, branch_name
        `;

        // Total count for the grouped results
        const countQuery = `SELECT COUNT(*) FROM (${baseGroupQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        let finalQuery = `${baseGroupQuery} ORDER BY exam_date ASC, start_time ASC`;

        // Pagination
        if (page && limit) {
            const offset = (page - 1) * limit;
            finalQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(finalQuery, params);

        return {
            status: true,
            message: 'Exam schedule fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async getPerformanceSummary(branch_id: number, exam_id: number, class_id: number, section_id: number, performance_filter?: string, page?: number, limit?: number) {
        if (!branch_id || !exam_id || !class_id || !section_id) {
            throw new BadRequestException('branch_id, exam_id, class_id, and section_id are required');
        }

        // Calculate average percentage for the selected group
        const avgQuery = `
            SELECT AVG(percentage) as group_avg 
            FROM exam_result_summary ers
            WHERE ers.branch_id = $1 AND ers.exam_id = $2 AND ers.class_id = $3 AND ers.section_id = $4 AND ers.status = 1
        `;
        const avgResult = await this.dataSource.query(avgQuery, [branch_id, exam_id, class_id, section_id]);
        const groupAvg = parseFloat(avgResult[0]?.group_avg || 0);

        // Initialize params with base filters and group average
        const queryParams: any[] = [branch_id, exam_id, class_id, section_id, groupAvg];
        const groupAvgIdx = 5;
        let pIdx = 6;

        // Fetch student-wise performance (base query)
        let studentQuery = `
            SELECT 
                ers.student_id,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                ers.total_obtained_marks,
                ers.total_max_marks,
                ers.percentage,
                ers.grade,
                b.branch_name,
                c.class_name,
                sec.section_name,
                et.exam_type as exam_type_name,
                CASE 
                    WHEN ers.percentage >= $${groupAvgIdx} THEN 'above_average'
                    ELSE 'below_average'
                END as performance_category
            FROM exam_result_summary ers
            JOIN students s ON ers.student_id = s.student_id
            JOIN branches b ON ers.branch_id = b.branch_id
            JOIN classes c ON ers.class_id = c.class_id
            JOIN sections sec ON ers.section_id = sec.section_id
            JOIN exam_master em ON ers.exam_id = em.exam_id
            JOIN exam_types et ON em.exam_type = et.exam_type_id
            WHERE ers.branch_id = $1 AND ers.exam_id = $2 AND ers.class_id = $3 AND ers.section_id = $4 AND ers.status = 1
        `;

        if (performance_filter === 'above') {
            studentQuery = `SELECT * FROM (${studentQuery}) as sub WHERE percentage >= $${groupAvgIdx}`;
        } else if (performance_filter === 'below') {
            studentQuery = `SELECT * FROM (${studentQuery}) as sub WHERE percentage < $${groupAvgIdx}`;
        }

        studentQuery += ` ORDER BY percentage DESC`;

        const countQuery = `SELECT COUNT(*) FROM (${studentQuery}) as total`;
        const totalResult = await this.dataSource.query(countQuery, queryParams);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        // Pagination
        if (page && limit) {
            const offset = (page - 1) * limit;
            studentQuery += ` LIMIT $${pIdx++} OFFSET $${pIdx++}`;
            queryParams.push(limit, offset);
        }

        const students = await this.dataSource.query(studentQuery, queryParams);

        return {
            status: true,
            message: 'Performance summary fetched successfully',
            data: {
                group_average: groupAvg,
                performance_filter: performance_filter || 'all',
                student_list: students
            },
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async getSubjectWisePerformance(branch_id: number, exam_id: number, class_id: number, section_id: number) {
        if (!branch_id || !exam_id || !class_id || !section_id) {
            throw new BadRequestException('branch_id, exam_id, class_id, and section_id are required');
        }

        const query = `
            SELECT 
                er.subject_id,
                ms.subject_name,
                er.obtained_marks,
                b.branch_name,
                c.class_name,
                sec.section_name,
                et.exam_type as exam_type_name,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.student_id
            FROM exam_result er
            JOIN exam_result_summary ers ON er.result_id = ers.result_id
            JOIN students s ON ers.student_id = s.student_id
            JOIN branches b ON ers.branch_id = b.branch_id
            JOIN classes c ON ers.class_id = c.class_id
            JOIN sections sec ON ers.section_id = sec.section_id
            JOIN exam_master em ON ers.exam_id = em.exam_id
            JOIN exam_types et ON em.exam_type = et.exam_type_id
            JOIN subjects sub ON er.subject_id = sub.id
            JOIN master_subjects ms ON sub.master_subject_id = ms.id
            WHERE ers.branch_id = $1 AND ers.exam_id = $2 AND ers.class_id = $3 AND ers.section_id = $4 
            AND ers.status = 1 AND er.status = 1
            ORDER BY er.subject_id, er.obtained_marks DESC
        `;

        const rawData = await this.dataSource.query(query, [branch_id, exam_id, class_id, section_id]);

        // Group by subject to find toppers and losers
        const performance = {};
        rawData.forEach(row => {
            if (!performance[row.subject_id]) {
                performance[row.subject_id] = {
                    subject_id: row.subject_id,
                    subject_name: row.subject_name,
                    branch_name: row.branch_name,
                    class_name: row.class_name,
                    section_name: row.section_name,
                    exam_type_name: row.exam_type_name,
                    toppers: [],
                    losers: [],
                    max_marks: row.obtained_marks,
                    min_marks: row.obtained_marks
                };
            }

            const sub = performance[row.subject_id];

            // Toppers logic
            if (row.obtained_marks > sub.max_marks) {
                sub.max_marks = row.obtained_marks;
                sub.toppers = [{ name: row.student_name, marks: row.obtained_marks }];
            } else if (row.obtained_marks === sub.max_marks) {
                sub.toppers.push({ name: row.student_name, marks: row.obtained_marks });
            }

            // Losers logic (initial list will have everyone, we prune it at the end)
            if (row.obtained_marks < sub.min_marks) {
                sub.min_marks = row.obtained_marks;
                sub.losers = [{ name: row.student_name, marks: row.obtained_marks }];
            } else if (row.obtained_marks === sub.min_marks) {
                sub.losers.push({ name: row.student_name, marks: row.obtained_marks });
            }
        });

        return {
            status: true,
            message: 'Subject-wise performance fetched successfully',
            data: Object.values(performance)
        };
    }

    async getSubjectWiseTopTen(branch_id: number, exam_id: number, class_id: number, section_id: number, subject_id: number) {
        if (!branch_id || !exam_id || !class_id || !section_id || !subject_id) {
            throw new BadRequestException('branch_id, exam_id, class_id, section_id, and subject_id are required');
        }

        const query = `
            SELECT 
                s.student_id,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.roll_number,
                er.obtained_marks,
                er.max_marks,
                er.passing_marks,
                b.branch_name,
                c.class_name,
                sec.section_name,
                ms.subject_name,
                et.exam_type as exam_type_name,
                CASE 
                    WHEN er.max_marks > 0 THEN ROUND((er.obtained_marks::numeric * 100 / er.max_marks::numeric), 2)
                    ELSE 0
                END as percentage,
                CASE 
                    WHEN er.obtained_marks >= er.passing_marks THEN 'Pass'
                    ELSE 'Fail'
                END as subject_result,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM exam_result er2 
                        WHERE er2.result_id = ers.result_id 
                        AND er2.obtained_marks < er2.passing_marks 
                        AND er2.status = 1
                    ) THEN 'Fail'
                    ELSE 'Pass'
                END as overall_result
            FROM exam_result er
            INNER JOIN exam_result_summary ers ON er.result_id = ers.result_id
            INNER JOIN students s ON ers.student_id = s.student_id
            INNER JOIN branches b ON ers.branch_id = b.branch_id
            INNER JOIN classes c ON ers.class_id = c.class_id
            INNER JOIN sections sec ON ers.section_id = sec.section_id
            INNER JOIN exam_master em ON ers.exam_id = em.exam_id
            INNER JOIN exam_types et ON em.exam_type = et.exam_type_id
            INNER JOIN subjects sub ON er.subject_id = sub.id
            INNER JOIN master_subjects ms ON sub.master_subject_id = ms.id
            WHERE ers.branch_id = $1 
              AND ers.exam_id = $2 
              AND ers.class_id = $3 
              AND ers.section_id = $4 
              AND er.subject_id = $5 
              AND ers.status = 1 
              AND er.status = 1
            ORDER BY er.obtained_marks DESC
            LIMIT 10
        `;

        const result = await this.dataSource.query(query, [branch_id, exam_id, class_id, section_id, subject_id]);

        return {
            status: true,
            message: 'Subject-wise top 10 fetched successfully',
            data: result
        };
    }

    async getPassFailSheet(branch_id: number, exam_id: number, class_id: number, section_id: number, page?: number, limit?: number) {
        if (!branch_id || !exam_id || !class_id || !section_id) {
            throw new BadRequestException('branch_id, exam_id, class_id, and section_id are required');
        }

        // Base query for students and their summary
        const summaryQuery = `
            SELECT 
                ers.result_id,
                ers.student_id,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.roll_number,
                ers.total_obtained_marks,
                ers.total_max_marks,
                ers.percentage,
                ers.grade,
                b.branch_name,
                c.class_name,
                sec.section_name,
                et.exam_type as exam_type_name,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM exam_result er 
                        WHERE er.result_id = ers.result_id 
                        AND er.obtained_marks < er.passing_marks 
                        AND er.status = 1
                    ) THEN 'Fail'
                    ELSE 'Pass'
                END as overall_result
            FROM exam_result_summary ers
            JOIN students s ON ers.student_id = s.student_id
            JOIN branches b ON ers.branch_id = b.branch_id
            JOIN classes c ON ers.class_id = c.class_id
            JOIN sections sec ON ers.section_id = sec.section_id
            JOIN exam_master em ON ers.exam_id = em.exam_id
            JOIN exam_types et ON em.exam_type = et.exam_type_id
            WHERE ers.branch_id = $1 AND ers.exam_id = $2 AND ers.class_id = $3 AND ers.section_id = $4 AND ers.status = 1
            ORDER BY s.roll_number ASC
        `;

        const totalResult = await this.dataSource.query(`SELECT COUNT(*) FROM (${summaryQuery}) as total`, [branch_id, exam_id, class_id, section_id]);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        let finalQuery = summaryQuery;
        const params: any[] = [branch_id, exam_id, class_id, section_id];
        if (page && limit) {
            const offset = (page - 1) * limit;
            finalQuery += ` LIMIT $5 OFFSET $6`;
            params.push(limit, offset);
        }

        const students = await this.dataSource.query(finalQuery, params);

        return {
            status: true,
            message: 'Pass/Fail sheet fetched successfully',
            data: students,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

}

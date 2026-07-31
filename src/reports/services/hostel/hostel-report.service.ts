
import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HostelReportService {
    constructor(private dataSource: DataSource) { }

    // 1. Hostel Occupancy Report: Detailed stats per hostel (Total beds, Occupied, Vacant, Percentage)
    async getHostelOccupancyReport(branch_id: number, page?: number, limit?: number) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];
        let idx = 2;

        let query = `
            SELECT 
                h.id as hostel_id,
                h.name as hostel_name,
                h.type,
                h.warden_name,
                COUNT(hr.id) as total_rooms,
                COALESCE(SUM(hr.bed_count), 0) as total_capacity,
                (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1) as occupied_beds,
                (COALESCE(SUM(hr.bed_count), 0) - (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1)) as vacant_beds,
                CASE 
                    WHEN COALESCE(SUM(hr.bed_count), 0) > 0 THEN 
                        ROUND(((SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.hostel_id = h.id AND ha.status = 1)::numeric / SUM(hr.bed_count)::numeric) * 100, 2)
                    ELSE 0 
                END as occupancy_percentage
            FROM hostels h
            LEFT JOIN hostel_rooms hr ON hr.hostel_id = h.id AND hr.status = 1
            WHERE h.branch_id = $1 AND h.status = 1
            GROUP BY h.id, h.name, h.type, h.warden_name
            ORDER BY h.name ASC
        `;

        if (page && limit) {
            const offset = (page - 1) * limit;
            query += ` LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(query, params);

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM hostels h
            WHERE h.branch_id = $1 AND h.status = 1
        `;
        const totalResult = await this.dataSource.query(countQuery, [branch_id]);
        const totalRecords = parseInt(totalResult[0]?.total || '0', 10);

        return {
            status: true,
            message: 'Hostel occupancy report fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1
        };
    }

    // 2. Room Allocation Report: List of students allocated to rooms in a hostel
    async getRoomAllocationReport(
        branch_id: number,
        hostel_id: number,
        page?: number,
        limit?: number
    ) {
        if (!branch_id || !hostel_id) {
            throw new BadRequestException('branch_id and hostel_id are required');
        }

        const params: any[] = [branch_id, hostel_id];
        let idx = 3;

        let query = `
            SELECT 
                ha.id as allocation_id,
                hr.room_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.roll_number,
                c.class_name,
                sec.section_name,
                ha.start_date,
                ha.end_date
            FROM hostel_allocations ha
            JOIN hostel_rooms hr ON ha.hostel_room_id = hr.id
            JOIN students s ON ha.student_id = s.student_id
            JOIN classes c ON ha.class_id = c.class_id
            JOIN sections sec ON ha.section_id = sec.section_id
            WHERE ha.hostel_id = $2 
              AND ha.branch_id = $1 
              AND ha.status = 1
            ORDER BY hr.room_number ASC, s.first_name ASC
        `;

        if (page && limit) {
            const offset = (page - 1) * limit;
            query += ` LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(query, params);

        const countQuery = `
            SELECT COUNT(*) as total
            FROM hostel_allocations ha
            WHERE ha.hostel_id = $2 
              AND ha.branch_id = $1 
              AND ha.status = 1
        `;
        const totalResult = await this.dataSource.query(countQuery, [branch_id, hostel_id]);
        const totalRecords = parseInt(totalResult[0]?.total || '0', 10);

        return {
            status: true,
            message: 'Room allocation report fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1
        };
    }
}

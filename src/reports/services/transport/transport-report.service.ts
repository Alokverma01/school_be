import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TransportReportService {
    constructor(private readonly dataSource: DataSource) { }

    async getVehicleDetailsReport(branch_id?: number, page?: number, limit?: number) {
        let conditions = `WHERE v.status = 1`;
        const params: any[] = [];

        if (branch_id) {
            conditions += ` AND v.branch_id = $${params.length + 1}`;
            params.push(branch_id);
        }

        let baseQuery = `
            SELECT 
                b.branch_name,
                v.vehicle_no,
                vt.vehicle_type,
                v.capacity,
                d.name AS driver_name
            FROM vehicles v
            LEFT JOIN branches b ON b.branch_id = v.branch_id
            LEFT JOIN vehicle_types vt ON vt.vehicle_type_id = v.vehicle_type_id
            LEFT JOIN drivers d ON d.driver_id = v.driver_id
            ${conditions}
            ORDER BY v.vehicle_id ASC
        `;

        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);
        }

        const data = await this.dataSource.query(baseQuery, params);

        const countParams = branch_id ? [branch_id] : [];
        const totalResult = await this.dataSource.query(
            `SELECT COUNT(*) FROM vehicles v ${conditions}`,
            countParams
        );
        const totalRecords = Number(totalResult[0].count);

        return {
            status: true,
            message: 'Vehicle details report fetched successfully',
            data,
            totalRecords,
            totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getRouteStudentCountReport(branch_id?: number, page?: number, limit?: number) {
        let conditions = `WHERE r.status = 1`;
        const params: any[] = [];

        if (branch_id) {
            conditions += ` AND r.branch_id = $${params.length + 1}`;
            params.push(branch_id);
        }

        let baseQuery = `
            SELECT 
                b.branch_name,
                r.route_name,
                r.start_point,
                r.end_point,
                COUNT(sta.id) AS student_count
            FROM routes r
            LEFT JOIN branches b ON b.branch_id = r.branch_id
            LEFT JOIN fee_structures fs ON fs.route_id = r.route_id AND fs.status = 1
            LEFT JOIN student_transport_assignment sta ON sta.fee_structure_id = fs.id AND sta.status = 1
            ${conditions}
            GROUP BY b.branch_id, b.branch_name, r.route_id, r.route_name
            ORDER BY r.route_id ASC
        `;

        if (page && limit) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);
        }

        const data = await this.dataSource.query(baseQuery, params);

        const countParams = branch_id ? [branch_id] : [];
        const totalResult = await this.dataSource.query(
            `SELECT COUNT(*) FROM routes r ${conditions}`,
            countParams
        );
        const totalRecords = Number(totalResult[0].count);

        return {
            status: true,
            message: 'Route-wise student count report fetched successfully',
            data,
            totalRecords,
            totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
        };
    }

    async getTransportSummaryReport(branch_id?: number) {
        let conditions = '';
        const params: any[] = [];

        if (branch_id) {
            conditions = `WHERE b.branch_id = $1`;
            params.push(branch_id);
        }

        const query = `
            SELECT 
                b.branch_name,
                (SELECT COUNT(*) FROM vehicles v WHERE v.branch_id = b.branch_id AND v.status = 1) AS total_vehicles,
                (SELECT COUNT(*) FROM drivers d WHERE d.branch_id = b.branch_id AND d.status = 1) AS total_drivers,
                (SELECT COUNT(*) FROM student_transport_assignment sta WHERE sta.branch_id = b.branch_id AND sta.status = 1) AS total_students
            FROM branches b
            ${conditions}
            ORDER BY b.branch_name ASC
        `;

        const result = await this.dataSource.query(query, params);

        return {
            status: true,
            message: 'Transport summary report fetched successfully',
            data: branch_id ? result[0] : result,
        };
    }
}

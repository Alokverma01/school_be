import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchoolShopReportService {
    constructor(private readonly dataSource: DataSource) { }

    async getSalesReport(
        branch_id: number,
        month?: number,
        year?: number,
        page?: number,
        limit?: number
    ) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];
        let conditions = 'WHERE o.branch_id = $1 AND o.status = 1';
        let idx = 2;

        if (month) {
            conditions += ` AND EXTRACT(MONTH FROM o.created_at) = $${idx++}`;
            params.push(month);
        }

        if (year) {
            conditions += ` AND EXTRACT(YEAR FROM o.created_at) = $${idx++}`;
            params.push(year);
        }

        const query = `
            SELECT 
                o.order_id,
                b.branch_name,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                c.class_name,
                sec.section_name,
                inv.item_name as product_name,
                oi.quantity,
                inv.unit_cost as unit_price,
                o.created_at,
                o.total_amount
            FROM orders o
            LEFT JOIN branches b ON o.branch_id = b.branch_id
            LEFT JOIN students s ON o.student_id = s.student_id
            LEFT JOIN classes c ON o.class_id = c.class_id
            LEFT JOIN sections sec ON o.section_id = sec.section_id
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN inventory inv ON oi.product_id = inv.item_id
            ${conditions}
            ORDER BY o.created_at DESC
        `;

        // Count for pagination
        const countQuery = `SELECT COUNT(*) FROM (${query}) as total`;
        const totalResult = await this.dataSource.query(countQuery, params);
        const totalRecords = parseInt(totalResult[0]?.count || 0);

        let finalQuery = query;
        if (page && limit) {
            const offset = (page - 1) * limit;
            finalQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
        }

        const result = await this.dataSource.query(finalQuery, params);

        return {
            status: true,
            message: 'Monthly sales report fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    async getRevenueReport(
        branch_id: number,
        month?: number,
        year?: number
    ) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];
        let conditions = 'WHERE o.branch_id = $1 AND o.status = 1';
        let idx = 2;

        if (month) {
            conditions += ` AND EXTRACT(MONTH FROM o.created_at) = $${idx++}`;
            params.push(month);
        }

        if (year) {
            conditions += ` AND EXTRACT(YEAR FROM o.created_at) = $${idx++}`;
            params.push(year);
        }

        const query = `
            SELECT 
                b.branch_name,
                TO_CHAR(o.created_at, 'YYYY-MM') as period,
                SUM(o.total_amount) as total_revenue,
                COUNT(o.order_id) as total_orders
            FROM orders o
            LEFT JOIN branches b ON o.branch_id = b.branch_id
            ${conditions}
            GROUP BY b.branch_name, period
            ORDER BY period DESC
        `;

        const revenueByProduct = `
            SELECT 
                b.branch_name,
                inv.item_name as product_name,
                SUM(oi.quantity) as units_sold,
                SUM(oi.quantity * inv.unit_cost) as revenue_generated
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN branches b ON o.branch_id = b.branch_id
            JOIN inventory inv ON oi.product_id = inv.item_id
            ${conditions}
            GROUP BY b.branch_name, inv.item_name
            ORDER BY revenue_generated DESC
        `;

        const [periodRevenue, productRevenue] = await Promise.all([
            this.dataSource.query(query, params),
            this.dataSource.query(revenueByProduct, params)
        ]);

        return {
            status: true,
            message: 'Monthly revenue report fetched successfully',
            data:periodRevenue,
            // data: {
            //     revenue_by_period: periodRevenue,
            //     revenue_by_product: productRevenue
            // }
        };
    }
}

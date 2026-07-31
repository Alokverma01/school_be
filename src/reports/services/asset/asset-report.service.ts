import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AssetReportService {
    constructor(private readonly dataSource: DataSource) { }

    async getAssetSummary() {
        const query = `
            SELECT 
                b.branch_name,
                b.address as branch_address,
                a.asset_name,
                cat.category_name as category,
                SUM(a.cost) as total_value
            FROM assets a
            JOIN branches b ON a.branch_id = b.branch_id
            JOIN asset_categories cat ON a.category_id = cat.category_id
            WHERE a.status = 1
            GROUP BY b.branch_name, b.address, a.asset_name, cat.category_name
            ORDER BY cat.category_name, a.asset_name
        `;

        const data = await this.dataSource.query(query);

        return {
            status: true,
            message: 'Asset branch-wise summary fetched successfully',
            data: data
        };
    }

    async getAssetList(
        branch_id: number,
        page?: number,
        limit?: number
    ) {
        if (!branch_id) {
            throw new BadRequestException('branch_id is required');
        }

        const params: any[] = [branch_id];
        let conditions = 'WHERE a.branch_id = $1 AND a.status = 1';
        let idx = 2;


        const query = `
            SELECT 
                a.asset_id,
                b.branch_name,
                b.address as branch_address,
                a.asset_name,
                cat.category_name as category,
                loc.location_name,
                st.status_name as condition,
                a.purchase_date,
                a.cost as total_value,
                a.warranty_expiry
            FROM assets a
            JOIN branches b ON a.branch_id = b.branch_id
            LEFT JOIN asset_categories cat ON a.category_id = cat.category_id
            LEFT JOIN asset_locations loc ON a.location_id = loc.location_id
            LEFT JOIN asset_status st ON a.status_id = st.status_id
            ${conditions}
            ORDER BY a.purchase_date DESC
        `;

        // Total count for pagination
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
            message: 'Asset detailed list for branch fetched successfully',
            data: result,
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page || 1
        };
    }

    // async getDepreciationReport(branch_id: number, annual_rate: number = 10) {
    //     if (!branch_id) {
    //         throw new BadRequestException('branch_id is required');
    //     }

    //     const query = `
    //         SELECT 
    //             a.asset_id,
    //             a.asset_name,
    //             cat.category_name,
    //             a.purchase_date,
    //             a.cost,
    //             EXTRACT(DAY FROM (NOW() - a.purchase_date::timestamp)) / 365.25 as age_years
    //         FROM assets a
    //         JOIN asset_categories cat ON a.category_id = cat.category_id
    //         WHERE a.branch_id = $1 AND a.status = 1
    //     `;

    //     const assets = await this.dataSource.query(query, [branch_id]);

    //     const report = assets.map(asset => {
    //         const cost = parseFloat(asset.cost);
    //         const age = parseFloat(asset.age_years);
    //         const rate = annual_rate / 100;

    //         /**
    //          * Depreciation Calculation (Straight Line Method):
    //          * 
    //          * 1. Annual Depreciation = Original Cost * (Annual Rate / 100)
    //          * 2. Accumulated Depreciation = Annual Depreciation * Age (in years)
    //          *    (Capped at the original cost to avoid negative value)
    //          * 3. Current Book Value = Original Cost - Accumulated Depreciation
    //          */
    //         const accumulated_depreciation = Math.min(cost, cost * rate * age);
    //         const current_value = Math.max(0, cost - accumulated_depreciation);

    //         return {
    //             asset_id: asset.asset_id,
    //             asset_name: asset.asset_name,
    //             category: asset.category_name,
    //             purchase_date: asset.purchase_date,
    //             original_cost: cost,
    //             age_years: age.toFixed(2),
    //             accumulated_depreciation: accumulated_depreciation.toFixed(2),
    //             current_book_value: current_value.toFixed(2),
    //             calculation_method: 'Straight Line Method (SLM)'
    //         };
    //     });

    //     return {
    //         status: true,
    //         message: 'Asset depreciation report generated successfully',
    //         calculation_info: 'Depreciation = Original Cost * (Rate/100) * Age_In_Years',
    //         data: report,
    //         rate_used: `${annual_rate}%`
    //     };
    // }
}

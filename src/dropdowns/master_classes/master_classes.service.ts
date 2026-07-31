import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MasterClassesService {
    constructor(@InjectDataSource() private dataSource: DataSource) { }

    async findAll() {
        const data = await this.dataSource.query(
            `SELECT id, class_name 
       FROM master_classes 
       WHERE status = 1 
       ORDER BY id ASC`,
        );

        return {
            status: true,
            message: 'All master classes fetched successfully',
            data: data,
        };
    }
}

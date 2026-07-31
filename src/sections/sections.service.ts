import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SectionsService {
    constructor(readonly dataSource: DataSource) {}

    //get all sections
    async findAll() {
        const query = `SELECT section_id , section_name FROM sections WHERE status = 1`;
        const data = await this.dataSource.query(query);
        return { 
            status: true, 
            message: 'Sections fetched successfully',
            data:data
        };
    }
}

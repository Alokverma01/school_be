import { Controller, Get } from '@nestjs/common';
import { MasterClassesService } from './master_classes.service';

@Controller('master-classes')
export class MasterClassesController {
    constructor(private readonly masterClassesService: MasterClassesService) { }

    @Get('get-all')
    async findAll() {
        return await this.masterClassesService.findAll();
    }
}

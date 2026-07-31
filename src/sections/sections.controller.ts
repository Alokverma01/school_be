import { Controller, Get } from '@nestjs/common';
import { SectionsService } from './sections.service';

@Controller('sections')
export class SectionsController {
    constructor(private readonly service: SectionsService) {}

    //get all sections
    @Get('get-all-sections')
    findAll() {
        return this.service.findAll();
    }

}

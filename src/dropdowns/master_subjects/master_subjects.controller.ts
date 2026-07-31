import {
    Controller,
    Get,
    Post,
    Body,
    Delete,
    Query,
    Put,
} from '@nestjs/common';
import { MasterSubjectsService } from './master_subjects.service';

@Controller('master-subjects')
export class MasterSubjectsController {
    constructor(private readonly masterSubjectsService: MasterSubjectsService) { }

    @Post("create")
    create(@Body('subject_name') subject_name: string) {
        return this.masterSubjectsService.create(subject_name);
    }

    @Get("get-all")
    findAll() {
        return this.masterSubjectsService.findAll();
    }

    @Get('get-by-id')
    findOne(@Query('id') id: number) {
        return this.masterSubjectsService.findOne(id);
    }

    @Put('update')
    update(
        @Query('id') id: number,
        @Body('subject_name') subject_name: string,
    ) {
        return this.masterSubjectsService.update(id, subject_name);
    }

    @Delete('delete')
    remove(@Query('id') id: number) {
        return this.masterSubjectsService.remove(id);
    }
}

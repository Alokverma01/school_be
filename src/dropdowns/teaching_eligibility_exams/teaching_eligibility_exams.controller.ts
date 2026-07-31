import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { TeachingEligibilityExamsService } from './teaching_eligibility_exams.service';

@Controller('teaching-eligibility-exams')
export class TeachingEligibilityExamsController {
  constructor(
    private readonly teachingEligibilityExamService: TeachingEligibilityExamsService,
  ) {}

  @Post('create')
  create(@Body('name') name: string) {
    return this.teachingEligibilityExamService.create(name);
  }

  @Get('get-all')
  findAll() {
    return this.teachingEligibilityExamService.findAll();
  }

  @Get('get-by-id')
  findOne(@Query('id') id: number) {
    return this.teachingEligibilityExamService.findOne(id);
  }

  @Put('update')
  update(@Query('id') id: number, @Body('name') name: string) {
    return this.teachingEligibilityExamService.update(id, name);
  }

  @Delete('delete')
  remove(@Query('id') id: number) {
    return this.teachingEligibilityExamService.remove(id);
  }
}

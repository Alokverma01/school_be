import { Module } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complaints } from './complaints.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Complaints])],
  providers: [ComplaintsService],
  controllers: [ComplaintsController]
})
export class ComplaintsModule {}

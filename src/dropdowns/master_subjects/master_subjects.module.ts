import { Module } from '@nestjs/common';
import { MasterSubjectsController } from './master_subjects.controller';
import { MasterSubjectsService } from './master_subjects.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterSubject } from './master_subjects.entity';

@Module({
    imports: [TypeOrmModule.forFeature([MasterSubject])],
    controllers: [MasterSubjectsController],
    providers: [MasterSubjectsService]
})
export class MasterSubjectsModule { }

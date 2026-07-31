import { Module } from '@nestjs/common';
import { TeacherPayrollLeaveController } from './teacher-payroll-leave.controller';
import { TeacherPayrollLeaveService } from './teacher-payroll-leave.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payroll, TeacherLeave } from './teacher-payroll-leave.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payroll, TeacherLeave])],
  controllers: [TeacherPayrollLeaveController],
  providers: [TeacherPayrollLeaveService],
})
export class TeacherPayrollLeaveModule {}

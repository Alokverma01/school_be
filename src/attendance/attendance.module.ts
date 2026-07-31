import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAttendance } from './student_attendance.entity';
import { TeacherAttendance } from './teacher_sttendance.entity';

@Module({
  imports:[TypeOrmModule.forFeature([StudentAttendance , TeacherAttendance])],
  providers: [AttendanceService],
  controllers: [AttendanceController]
})
export class AttendanceModule {}

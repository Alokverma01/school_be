import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { LeaveType, PaidStatus, Months } from './teacher-payroll-leave.entity';

export class CreatePayrollDto {
  @IsNumber()
  branch_id: number;

  @IsNumber()
  teacher_id: number;

  @IsEnum(Months)
  month: Months;

  @IsNumber()
  year: number;

  @IsNumber()
  base_salary: number;

  @IsNumber()
  deductions: number;

  @IsNumber()
  incentives: number;

  @IsNumber()
  net_salary: number;

  @IsEnum(PaidStatus)
  paid_status: PaidStatus;

  @IsOptional()
  @IsDateString()
  payment_date?: Date;
}

export class CreateTeacherLeaveDto {
  @IsNumber()
  branch_id: number;

  @IsNumber()
  teacher_id: number;

  @IsEnum(LeaveType)
  leave_type: LeaveType;

  @IsDateString()
  from_date: Date;

  @IsDateString()
  to_date: Date;

  @IsString()
  reason: string;
}

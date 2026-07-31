import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Teachers } from '../teachers/teachers.entity';
import { Branches } from '../branches/branches.entity';

export enum PaidStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
}
export enum LeaveType {
  CASUAL = 'casual',
  SICK = 'sick',
  ANNUAL = 'annual',
}
export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum Months {
  JANUARY = 'January',
  FEBRUARY = 'February',
  MARCH = 'March',
  APRIL = 'April',
  MAY = 'May',
  JUNE = 'June',
  JULY = 'July',
  AUGUST = 'August',
  SEPTEMBER = 'September',
  OCTOBER = 'October',
  NOVEMBER = 'November',
  DECEMBER = 'December',
}

@Entity('teacher_ payroll')
export class Payroll {
  @PrimaryGeneratedColumn()
  payroll_id: number;

  @ManyToOne(() => Branches)
  @JoinColumn({ name: 'branch_id' })
  branch: Branches;

  @Column()
  branch_id: number;

  @ManyToOne(() => Teachers)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teachers;

  @Column()
  teacher_id: number;

  @Column({
    type: 'enum',
    enum: Months,
  })
  month: Months;

  @Column()
  year: number;

  @Column('float')
  base_salary: number;

  @Column('float')
  deductions: number;

  @Column('float')
  incentives: number;

  @Column('float')
  net_salary: number;

  @Column({
    type: 'enum',
    enum: PaidStatus,
  })
  paid_status: PaidStatus;

  @Column({ type: 'date', nullable: true })
  payment_date: Date;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

@Entity('teacher_leave')
export class TeacherLeave {
  @PrimaryGeneratedColumn()
  leave_id: number;

  @ManyToOne(() => Branches)
  @JoinColumn({ name: 'branch_id' })
  branch: Branches;

  @Column()
  branch_id: number;

  @ManyToOne(() => Teachers)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teachers;

  @Column()
  teacher_id: number;

  @Column({
    type: 'enum',
    enum: LeaveType,
  })
  leave_type: LeaveType;

  @Column({ type: 'date' })
  from_date: Date;

  @Column({ type: 'date' })
  to_date: Date;

  @Column('text')
  reason: string;

  @Column({
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  leave_status: LeaveStatus;


  @Column({ default: 1 })
  status: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

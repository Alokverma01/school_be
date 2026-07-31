
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Students } from '../students/students.entity';
import { Branches } from '../branches/branches.entity';
import { Classes } from '../classes/classes.entity';
import { Sections } from '../sections/sections.entity';
import { FeePaymentDetail } from './fee_payment_details.entity';

export enum FeePaymentMode {
  CASH = 1,
  CARD = 2,
  UPI = 3,
  BANK_TRANSFER = 4,
  CHEQUE = 5,
}

export enum FeePaymentStatus {
  PENDING = 0,
  PARTIAL = 1,
  PAID = 2,
}


@Entity('fee_payments')
export class FeePayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  branch_id: number;

  @ManyToOne(() => Branches)
  @JoinColumn({ name: 'branch_id' })
  branch: Branches;

  @Column({ type: 'int' })
  class_id: number;

  @ManyToOne(() => Classes)
  @JoinColumn({ name: 'class_id' })
  class: Classes;

  @Column({ type: 'int' })
  section_id: number;

  @ManyToOne(() => Sections)
  @JoinColumn({ name: 'section_id' })
  section: Sections;

  @Column({ type: 'int' })
  student_id: number;

  @ManyToOne(() => Students)
  @JoinColumn({ name: 'student_id' })
  student: Students;

  @Column('decimal', { precision: 12, scale: 2 })
  total_amount_paid: number;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'int' })
  payment_mode_id: number; 

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' , type:'timestamp' , default:()=>'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type:'timestamp' , default:()=>'CURRENT_TIMESTAMP'  })
  updated_at: Date;

  @OneToMany(() => FeePaymentDetail, (detail) => detail.payment, { cascade: true })
  details: FeePaymentDetail[];
}
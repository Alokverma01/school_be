// fee-payment-detail.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FeePayment } from './fee_payments.entity';

@Entity('fee_payment_details')
export class FeePaymentDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  fee_payment_id: number;

  @ManyToOne(() => FeePayment, (payment) => payment.details)
  @JoinColumn({ name: 'fee_payment_id' })
  payment: FeePayment;

  @Column({ type: 'int' })
  fee_structure_id: number; 

  @Column('decimal', { precision: 10, scale: 2 })
  amount_paid: number;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}

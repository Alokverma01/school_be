// src/entities/payment-mode.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payments_modes')
export class PaymentMode {
  @PrimaryGeneratedColumn({ name: 'payment_mode_id' })
  payment_mode_id: number;

  @Column({ length: 255, unique: true, name: 'payment_mode' })
  payment_mode: string;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
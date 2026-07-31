import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_details')
export class UserDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Address Details
  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'text' })
  city: string;

  @Column({ type: 'text' })
  state: string;

  @Column({ type: 'int' })
  pincode: string;

  // Bank Details
  @Column({ type: 'text' })
  bank_name: string;

  @Column({ type: 'text' })
  account_number: string;

  @Column({ type: 'text' })
  ifsc_code: string;

  @Column({ type: 'text' })
  branch: string;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

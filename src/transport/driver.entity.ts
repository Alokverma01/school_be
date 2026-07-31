import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn()
  driver_id: number;

  @Column({ type: 'int' })
  branch_id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 10 })
  mobile: string;

  @Column({ length: 12 })
  aadhar_no: string;

  @Column('text')
  address: string;

  @Column({ length: 10 })
  emergency_contact_mobile: string;

  @Column({ length: 50 })
  license_no: string;

  @Column({ type: 'date' })
  license_issue_date: Date;

  @Column({ type: 'date' })
  license_expiry_date: Date;

  @Column({ type: 'date' })
  joining_date: Date;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
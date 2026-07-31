import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('students')
export class Students {
  @PrimaryGeneratedColumn()
  student_id: number;

  @Column()
  branch_id: number;

  @Column()
  class_id: number;

  @Column()
  section_id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ unique: true })
  email: string;

  @Column()
  gender: string;

  @Column({ unique: true })
  student_aadhar: string;

  @Column({ unique: true })
  admission_number: string;

  @Column()
  roll_number: number;

  @Column({ name: 'is_ews', type: 'boolean', default: false })
  is_EWS: boolean;

  @Column({ type: 'text' })
  address: string;

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

  @Column({ type: 'smallint', default: 1 })
  status: number;
}

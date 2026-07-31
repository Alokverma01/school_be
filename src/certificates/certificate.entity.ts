
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserType {
  TEACHER = 'teacher',
  STUDENT = 'student',
  SCHOOL = 'school',
}

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn()
  certificate_id: number;

  @Column()
  branch_id: number;

  @Column({
    type: 'enum',
    enum: UserType,
  })
  issued_to: UserType;

  @Column({ nullable: true })
  class_id: number;

  @Column({ nullable: true })
  section_id: number;

  @Column()
  user_id: number;

  @Column()
  certificate_type_id: number;

  @Column()
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  issue_date: Date;

@Column({
  type: 'text',
  nullable: true,
})
file_url?: string;  // link

  @Column()
  uploaded_by: number;

  @Column({ default: 1 })
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

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('assignment_submissions')
export class Submission {
  @PrimaryGeneratedColumn({ name: 'submission_id' })
  submission_id: number;

  @Column({ name: 'branch_id', type: 'int', nullable: false })
  branch_id: number;

  @Column({ name: 'class_id', type: 'int', nullable: false })
  class_id: number;

  @Column({ name: 'section_id', type: 'int', nullable: false })
  section_id: number;

  @Column({ name: 'assignment_id', type: 'int', nullable: false })
  assignment_id: number;

  @Column({ name: 'student_id', type: 'int', nullable: false })
  student_id: number;

  @Column({ type: 'int' })
  marks: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column()
  file_url: string;

  @Column({ type: 'int', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', })
  updated_at: Date;
}

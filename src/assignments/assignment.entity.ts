import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn({ name: 'assignment_id' })
  assignment_id: number;

  @Column({ name: 'branch_id', type: 'int', nullable: false })
  branch_id: number;

  @Column({ name: 'class_id', type: 'int', nullable: false })
  class_id: number;

  @Column({ name: 'section_id', type: 'int', nullable: false })
  section_id: number;

  @Column({ name: 'subject_id', type: 'int', nullable: false })
  subject_id: number;

  @Column({ name: 'teacher_id', type: 'int', nullable: false })
  teacher_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  // Assignments may be created without an attachment.
  @Column({ type: 'varchar', nullable: true })
  file_url: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: false })
  dueDate: string; // or Date if you prefer Date object

  @Column({ type: 'int', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' , default: () => 'CURRENT_TIMESTAMP', })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' , default: () => 'CURRENT_TIMESTAMP', })
  updatedAt: Date;
}


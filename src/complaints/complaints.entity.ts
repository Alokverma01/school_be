  

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('complaints')
export class Complaints {
  @PrimaryGeneratedColumn()
  complaint_id: number;

  @Column({ type: 'int' })
  branch_id: number;

  @Column({ type: 'enum', enum: ['student', 'teacher'] })
  raised_by: 'student' | 'teacher';

  @Column({ type: 'int' })
  raised_by_id: number;

  @Column({ type: 'int', nullable: true })
  raised_by_class_id: number | null;

  @Column({ type: 'int', nullable: true })
  raised_by_section_id: number | null;

  @Column({ type: 'enum', enum: ['teacher', 'student'] })
  complaint_type: 'teacher' | 'student';

  @Column({ type: 'int' })
  against_id: number;

  @Column({ type: 'int', nullable: true })
  against_class_id: number | null;

  @Column({ type: 'int', nullable: true })
  against_section_id: number | null;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'low',
  })
  priority: 'low' | 'medium' | 'high';

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: ['open', 'resolved', 'closed'],
    default: 'open',
  })
  complaint_status: 'open' | 'resolved' | 'closed';

  // Resolution note (optional)
  @Column({ type: 'text', nullable: true })
  resolution_note: string | null;

  // Soft delete
  @Column({ type: 'smallint', default: 1 })
  status: number;

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
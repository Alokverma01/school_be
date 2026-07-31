import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subject } from '../subjects/subject.entity';
import { ExamResultSummary } from './exam_result_summary.entity';


@Entity('exam_result')
export class ExamResult {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  result_id: number;

  @ManyToOne(() => ExamResultSummary, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'result_id' })
  resultSummary: ExamResultSummary;

  // Subject
  @Column({ type: 'int' })
  subject_id: number;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ type: 'int' })
  obtained_marks: number;

  @Column({ type: 'int' })
  max_marks: number;

  @Column({ type: 'int' })
  passing_marks: number;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @Column({ type: 'smallint', default: 1 })
  status: number;
}

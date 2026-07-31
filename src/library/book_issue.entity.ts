import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('book_issue')
export class BookIssue {
  @PrimaryGeneratedColumn()
  issue_id: number;

  @Column()
  book_id: number;

  @Column()
  branch_id: number;

  @Column({ type: 'enum', enum: ['student', 'teacher'] })
  issued_to: 'student' | 'teacher';

  @Column({ nullable: true })
  class_id: number;

  @Column({ nullable: true })
  section_id: number;

  @Column()
  issued_to_id: number;

  @Column({ type: 'date' })
  issued_date: string;

  @Column({ type: 'date', nullable: true })
  return_date: string;

  @Column({ type: 'float', nullable: true })
  fine_amount: number;

  @Column({ type: 'enum', enum: ['issued', 'returned'], default: 'issued' })
  issue_status: 'issued' | 'returned';

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}


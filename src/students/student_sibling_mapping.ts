import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Students } from './students.entity';
import { IsEnum } from 'class-validator';

@Entity('student_sibling_mapping')
@Unique(['student', 'sibling']) // prevents duplicate mapping
export class StudentSiblingMapping {
  @PrimaryGeneratedColumn()
  id: number;

  // The main student
  @ManyToOne(() => Students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Students;

  // The sibling (also a student)
  @ManyToOne(() => Students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sibling_id' })
  sibling: Students;

  @Column({ type: 'enum', enum: ['brother', 'sister', 'twin'] })
  @IsEnum(['brother', 'sister', 'twin'] as const)
  relation_type: 'brother' | 'sister' | 'twin';
}

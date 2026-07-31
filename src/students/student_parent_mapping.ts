import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Students } from './students.entity';
import { Parents } from './parents.entity';

@Entity('student_parent_mapping')
export class StudentParentMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Students)
  @JoinColumn({ name: 'student_id' })
  student: Students;

  @Column()
  student_id: number;

  @ManyToOne(() => Parents)
  @JoinColumn({ name: 'parent_id' })
  parent: Parents;

  @Column()
  parent_id: number;

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

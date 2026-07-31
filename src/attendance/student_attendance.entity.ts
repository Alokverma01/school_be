import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Students } from 'src/students/students.entity';

@Entity('student_attendance')
export class StudentAttendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  branch_id: number;

  @Column()
  class_id: number;

  @Column()
  section_id: number;

  @Column()
  student_id: number;

  @ManyToOne(() => Students)
  @JoinColumn({ name: 'student_id' })
  student: Students;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'int',
    comment: '0: absent, 1: present, 2: late',
    default: 0,
  })
  attendance_status: number;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

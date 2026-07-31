import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Teachers } from '../teachers/teachers.entity';

@Entity('teacher_attendance')
export class TeacherAttendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  branch_id: number;

  @Column()
  teacher_id: number;

  @ManyToOne(() => Teachers)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teachers;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'int',
    comment: '0: absent, 1: present, 2: late',
    default: 0,
  })
  attendance_status: number;

  @Column({ type: 'time', nullable: true })
  check_in: string;

  @Column({ type: 'time', nullable: true })
  check_out: string;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

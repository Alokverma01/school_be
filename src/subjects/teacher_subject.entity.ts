
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Column, JoinColumn } from 'typeorm';
import { Teachers } from '../teachers/teachers.entity';
import { Subject } from './subject.entity';
import { Classes } from '../classes/classes.entity';
import { Sections } from '../sections/sections.entity';
import { Branches } from '../branches/branches.entity';

@Entity('teacher_subjects_allocation')
export class TeacherSubject {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Branches)
  @JoinColumn({ name: 'branch_id' })
  branch: Branches;

  @Column({ nullable: true })
  branch_id: number;

  @ManyToOne(() => Classes)
  @JoinColumn({ name: 'class_id' })
  class: Classes;

  @Column({ nullable: true })
  class_id: number;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ nullable: true })
  subject_id: number;

  @ManyToOne(() => Teachers)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teachers;

  @Column({ nullable: true })
  teacher_id: number;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

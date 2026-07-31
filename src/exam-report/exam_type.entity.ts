import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ExamMaster } from './exam_master.entity'; 
@Entity('exam_types')
export class ExamType {
  @PrimaryGeneratedColumn()
  exam_type_id!: number;

  @Column({
    type: 'varchar',
    length: 100,
  })
  exam_type!: string;

  @Column({
    type: 'smallint',
    default: 1,
  })
  status!: number;

  @OneToMany(
    () => ExamMaster,
    (exam) => exam.examType,
  )
  exams!: ExamMaster[];

  @CreateDateColumn({
    name: 'created_at',
  })
  created_at!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updated_at!: Date;
}
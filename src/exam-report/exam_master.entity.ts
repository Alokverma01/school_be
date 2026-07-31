import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Branches } from '../branches/branches.entity';
import { Classes } from '../classes/classes.entity';
import { ExamSubjectMapping } from './exam_subject_mapping.entity';
import { ExamTypes } from '../dropdowns/exam_type/exam_type.entity';

@Entity('exam_master')
export class ExamMaster {
  @PrimaryGeneratedColumn()
  exam_id!: number;

  // Branch
  @ManyToOne(() => Branches)
  @JoinColumn({ name: 'branch_id' })
  branch!: Branches;

  @Column()
  branch_id!: number;

  // Class
  @ManyToOne(() => Classes)
  @JoinColumn({ name: 'class_id' })
  class!: Classes;

  @Column({
    type: 'int',
    nullable: true,
  })
  class_id!: number;

  // Exam Type
  @ManyToOne(() => ExamTypes)
  @JoinColumn({ name: 'exam_type' })
  examType!: ExamTypes;

  @Column({
    type: 'int',
  })
  exam_type!: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  exam_name!: string | null;

  // Academic Year
  @Column({
    type: 'varchar',
    length: 20,
  })
  academic_year!: string;

  // Exam Start Date
  @Column({
    type: 'date',
  })
  start_date!: string;

  // Exam End Date
  @Column({
    type: 'date',
  })
  end_date!: string;

  // Exam Status
  @Column({
    type: 'enum',
    enum: ['draft', 'published'],
    default: 'draft',
  })
  exam_status!: 'draft' | 'published';

  // Subjects
  @OneToMany(
    () => ExamSubjectMapping,
    (mapping) => mapping.exam,
  )
  subjectMappings!: ExamSubjectMapping[];

  @CreateDateColumn({
    name: 'created_at',
  })
  created_at!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updated_at!: Date;

  @Column({
    type: 'smallint',
    default: 1,
  })
  status!: number;
}

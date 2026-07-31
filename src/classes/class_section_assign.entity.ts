import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Classes } from './classes.entity';
import { Sections } from '../sections/sections.entity';
import { Teachers } from '../teachers/teachers.entity';
import { Branches } from '../branches/branches.entity';

@Entity('class_section_assign')
export class ClassSectionAssign {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Branches)
  @JoinColumn({ name: 'branch_id' })
  branch!: Branches;

  @Column({ type: 'int', nullable: true })
  branch_id!: number;

  @ManyToOne(() => Classes)
  @JoinColumn({ name: 'class_id' })
  class!: Classes;

  @Column()
  class_id!: number;

  @ManyToOne(() => Sections)
  @JoinColumn({ name: 'section_id' })
  section!: Sections;

  @Column()
  section_id!: number;

  @ManyToOne(() => Teachers)
  @JoinColumn({ name: 'teacher_id' })
  class_teacher!: Teachers;

  @Column({ nullable: true })
  teacher_id!: number;

  @Column({ type: 'int', nullable: true })
  room_id!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ type: 'smallint', default: 1 })
  status!: number;
}

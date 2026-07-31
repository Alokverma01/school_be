import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Branches } from '../branches/branches.entity';
import { Classes } from '../classes/classes.entity';
import { Sections } from '../sections/sections.entity';

@Entity('timetable')
export class Timetable {
  @PrimaryGeneratedColumn()
  id!: number;

  // ---- Common Fields ----
  @ManyToOne(() => Branches)
  @JoinColumn({ name: 'branch_id' })
  branch!: Branches;

  @Column()
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

  @Column({ type: 'varchar', length: 20, nullable: true })
  academic_year!: string; // e.g., "2024-2025"

  @Column({ type: 'jsonb', nullable: true })
  periods: any; // e.g., { Mon: [{}], Tue: [{}], ... }

  // ---- System Fields ----
  @Column({ default: 1 })
  status!: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}

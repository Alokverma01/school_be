import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Classes } from "../classes/classes.entity";
import { Branches } from 'src/branches/branches.entity';

export enum SubjectType {
  THEORY = 'theory',
  PRACTICAL = 'practical'   
}

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Branches)
  @JoinColumn({ name: 'branch_id' })
  branch!: Branches;

  @ManyToOne(() => Classes)
  @JoinColumn({ name: 'class_id' })
  class!: Classes;

  @Column({ name: 'master_subject_id', nullable: true })
  master_subject_id!: number;

  @Column({ unique: true })
  code!: string;

  @Column({
    type: 'enum',
    enum: SubjectType,
    default: SubjectType.THEORY
  })
  type!: SubjectType;

  @Column({ default: 1 })
  status!: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}

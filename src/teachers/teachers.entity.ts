import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branches } from '../branches/branches.entity';
import { Sections } from 'src/sections/sections.entity';
import { TeacherQualifications } from './teachers-qualifications.entity';

@Entity('teachers')
export class Teachers {
  @PrimaryGeneratedColumn({ name: 'teacher_id' })
  teacher_id: number;

  @ManyToOne(() => Branches, (branch) => branch.branch_id, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branches;

  @Column({ name: 'branch_id' })
  branch_id: number;

  @OneToMany(() => Sections, (section) => section.teacher)
  sections: Sections[];

  @OneToMany(() => TeacherQualifications, (q) => q.teacher, { cascade: true })
  qualifications: TeacherQualifications[];

  @Column({ name: 'first_name', type: 'text' })
  first_name: string;

  @Column({ name: 'last_name', type: 'text' })
  last_name: string;

  @Column({ name: 'email', type: 'text', unique: true })
  email: string;

  @Column({ name: 'contact_number', type: 'text', unique: true })
  contact_number: string;

  @Column({ name: 'emergency_contact_number', type: 'text', nullable: true })
  emergency_contact_number: string;

  @Column({ name: 'teacher_aadhaar', type: 'text', unique: true })
  teacher_aadhaar: string;

  @Column({ name: 'experience_years', type: 'text', nullable: true })
  experience_years: string; // Updated

  @Column({ name: 'joining_date', type: 'date' })
  joining_date: string;

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string;

  @Column({ name: 'expertise_one_id', type: 'int' })
  expertise_one_id: number;

  @Column({ name: 'expertise_two_id', type: 'int', nullable: true })
  expertise_two_id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'smallint', default: 1 })
  status: number;
}

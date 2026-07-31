import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("teaching_eligibility_exams")
export class TeachingEligibilityExam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 150, unique: true })
  name: string;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
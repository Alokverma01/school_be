import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";

@Entity("hostel_allocations")
export class HostelAllocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  branch_id: number;

  @Column()
  hostel_id: number;

  @Column()
  hostel_room_id: number;

  @Column()
  class_id: number;

  @Column()
  section_id: number;

  @Column()
  student_id: number;

  @Column()
  start_date: string;

  @Column()
  end_date: string;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

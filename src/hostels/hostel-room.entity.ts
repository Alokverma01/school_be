import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Hostel } from "./hostel.entity";

@Entity("hostel_rooms")
export class HostelRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Hostel)
  @JoinColumn({ name: "hostel_id" })
  hostel: Hostel;

  @Column()
  branch_id: number;

  @Column()
  hostel_id: number;

  @Column()
  room_number: string;

  @Column()
  bed_count: number;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

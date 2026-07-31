import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum HostelType {
  BOYS = 0,
  GIRLS = 1,
  STAFF = 2,
}

@Entity("hostels")
export class Hostel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  branch_id: number;

  @Column({type:'int' , comment:'0: boys, 1: girls, 2: staff'})
  type: number;

  @Column()
  total_rooms: number;

  @Column()
  warden_name: string;

  @Column()
  date_of_joining: string;

  @Column({unique: true})
  contact_number: string;

  @Column({unique: true})
  aadhar_number: string;

  @Column()
  warden_address: string;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

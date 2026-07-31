import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Branches } from '../branches/branches.entity';


@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Branches)
  @JoinColumn({ name: 'branch_id' })
  branch: Branches;

  @Column()
  name: string;

  @Column({ enum: ['classroom', 'lab', 'library'] })
  type: string;

  @Column({ type: 'int'})
  capacity: number;

  @Column({default: 1})
  status: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

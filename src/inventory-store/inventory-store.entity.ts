import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  item_id: number;

  @Column()
  branch_id: number;

  @Column()
  item_name: string;

  @Column()
  category_id: number;

  @Column()
  quantity: number;

  @Column({ type: 'float' })
  unit_cost: number;

  @Column()
  vendor: string;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

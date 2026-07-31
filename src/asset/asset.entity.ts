import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn()
  asset_id: number;

  @Column({ type: 'int' })
  branch_id: number;

  @Column({ length: 255 })
  asset_name: string;
  
  @Column({ type: 'int' })
  category_id: number;

  @Column({ type: 'int' })
  location_id: number;

  @Column({ type: 'int' })
  status_id: number;

  @Column({ type: 'date' })
  purchase_date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cost: number;

  @Column({ type: 'date', nullable: true })
  warranty_expiry: Date | null;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
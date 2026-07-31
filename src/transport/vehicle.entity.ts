import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  vehicle_id: number;

  @Column({ type: 'int' })
  branch_id: number;

  @Column({ type: 'int' })
  vehicle_type_id: number;

  @Column({ type: 'varchar', length: 50 })
  vehicle_no: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'int' })
  driver_id: number;

  @Column({ type: 'date', nullable: true })
  maintenance_due_date: Date;

  @Column({ type: 'date', nullable: true })
  insurance_expiry: Date;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}

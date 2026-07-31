import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn()
  route_id: number;

  @Column({ type: 'int' })
  branch_id: number;

  @Column({ type: 'int' })
  vehicle_id: number;

  @Column({ type: 'varchar', length: 100 })
  route_name: string;

  @Column({ type: 'varchar', length: 100 })
  start_point: string;

  @Column({ type: 'varchar', length: 100 })
  end_point: string;

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

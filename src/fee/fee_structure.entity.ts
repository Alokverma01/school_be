import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';


@Entity('fee_structures')
export class FeeStructure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  branch_id: number;

  @Column({ type: 'int', nullable: true })
  class_id: number;

  @Column({ type: 'int' })
  fee_type_id: number;

  @Column({ type: 'int', nullable: true })
  route_id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

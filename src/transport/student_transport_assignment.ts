import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('student_transport_assignment')
export class StudentTransportAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  branch_id: number;

  @Column({ type: 'int' })
  class_id: number;

  @Column({ type: 'int' })
  section_id: number;

  @Column({ type: 'int' })
  student_id: number;

  @Column({ type: 'int' })
  fee_structure_id: number;

  @Column({ type: 'varchar', length: 150 })
  pickup_location: string;

  @Column({ type: 'varchar', length: 150 })
  drop_location: string;

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
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
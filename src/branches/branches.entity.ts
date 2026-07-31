import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('branches')
export class Branches {
  @PrimaryGeneratedColumn({ name: 'branch_id' })
  branch_id!: number;

  @Column({ name: 'branch_code', type: 'text' })
  branch_code!: string;

  @Column({ name: 'branch_name', type: 'text' })
  branch_name!: string;

  @Column({ name: 'address', type: 'text' })
  address!: string;

  // PRINCIPAL SHOULD STORE USER_ID
  @Column({ name: 'principal_id', type: 'int', nullable: false })
  principal_id!: number;

  @Column({ name: 'total_classes', type: 'int' })
  total_classes!: number;

  @Column({ name: 'total_students', type: 'int' })
  total_students!: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  @Column({ type: 'smallint', default: 1 })
  status!: number;
}

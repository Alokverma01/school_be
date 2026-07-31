// import { Department } from 'src/department/department.entity';
import {Department} from '../department/department.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('roles')
export class Role {

  @PrimaryGeneratedColumn({ name: 'role_id' })
  role_id: number;

  @Column({ name: 'role_name', type: 'text' })
  role_name: string;

  @ManyToOne(() => Department)
  @JoinColumn({
    name: 'department',               // FK column in roles table
    referencedColumnName: 'department_id' // PK column in department table
  })
  department: Department;

  // Self relationship → reports to another role
  @ManyToOne(() => Role, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reports_to' })
  reports_to: Role;
  
  @Column({ type: 'jsonb', nullable: false })
  access: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({type: 'smallint',default: 1}) 
  status: number;
}

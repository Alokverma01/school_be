import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('departments')
export class Department{

  @PrimaryGeneratedColumn({name:'department_id'})
  department_id:number;

  @Column({ name: 'department_name', type: 'text', unique: true})
  department_name:string

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({type: 'smallint',default: 1}) 
  status: number;
}
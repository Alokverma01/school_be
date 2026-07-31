import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique
} from 'typeorm';
import { Branches } from '../branches/branches.entity';
@Unique('uq_classes_branch_class', ['branch_id', 'class_name'])

@Entity('classes')
export class Classes {
  @PrimaryGeneratedColumn({ name: 'class_id' })
  class_id!: number;

  @Column({ name: 'class_name', type: 'text'})
  class_name!: string;

  // Branch → Foreign key
  @ManyToOne(() => Branches, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branches;

  @Column({ name: 'branch_id' })
  branch_id!: number;

  @CreateDateColumn({ name: 'created_at' , type:'timestamp' , default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' , type:'timestamp' , default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ type: 'smallint', default: 1 })
  status!: number;
}


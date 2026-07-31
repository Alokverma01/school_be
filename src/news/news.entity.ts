

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn({ name: 'news_id' })
  news_id: number;

  @Column({ name: 'branch_id', type: 'int' })
  branch_id: number;

  @Column({ name: 'news_code', type: 'text' })
  news_code: string;
  
  @Column({ name: 'news_title', type: 'text' })
  news_title: string;

  @Column({ name: 'news_date', type: 'date' })
  news_date: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ type: 'smallint', default: 1 })
  status: number;
}

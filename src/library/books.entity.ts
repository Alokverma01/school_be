import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('books')
export class Books {
  @PrimaryGeneratedColumn()
  book_id: number;

  @Column({ type: 'int' })
  branch_id: number;

  @Column()
  isbn: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column()
  category: string;

  @Column()
  publisher: string;

  @Column({ type: 'int' })
  total_copies: number;

  @Column({ type: 'int' })
  available_copies: number;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DocUserType {
  TEACHER = 'teacher',
  STUDENT = 'student',
  SCHOOL = 'school',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  document_id: number;

  @Column()
  branch_id: number;

  @Column({
    type: 'enum',
    enum: DocUserType,
  })
  doc_user_type: DocUserType;

  @Column({ nullable: true })
  class_id: number;

  @Column({ nullable: true })
  section_id: number;

  @Column()
  user_id: number;

  @Column()
  doc_type_id: number;

  @Column()
  title: string;

  @Column()
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  issue_date: Date;

  @Column()
  uploaded_by: number;

  // @Column()
  // file_url: string;  // link


  @Column({
  type: 'text',
  nullable: true,
})
file_url?: string;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}

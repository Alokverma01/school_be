import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Teachers } from '../teachers/teachers.entity';

@Entity('sections')
export class Sections {
  @PrimaryGeneratedColumn()
  section_id: number;

  @Column({ type: 'text', unique: true })
  section_name: string; // A, B, C, D, E

  @ManyToOne(() => Teachers, (teacher) => teacher.sections , { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teachers;

  @Column({ type:'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'smallint', default: 1 })
  status: number;
}

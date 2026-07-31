import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ExamMaster } from './exam_master.entity';
import { Subject } from '../subjects/subject.entity';
import { Branches } from '../branches/branches.entity';
import { Classes } from '../classes/classes.entity';
import { Sections } from '../sections/sections.entity';

@Entity('exam_subject_mapping')
@Unique(['exam_id', 'subject_id']) // Prevent duplicate mapping
export class ExamSubjectMapping {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => ExamMaster, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exam_id' })
    exam!: ExamMaster;
    @Column()
    exam_id!: number;

    @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subject_id' })
    subject!: Subject;

    @Column()
    subject_id!: number;

    @Column({ type: 'date' })
    exam_date!: string;

    @Column({ type: 'time', nullable: true })
    start_time!: string;

    @Column({ type: 'time', nullable: true })
    end_time!: string;

    @Column({ type: 'int' })
    max_marks!: number;

    @Column({ type: 'int' })
    passing_marks!: number;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    created_at!: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    updated_at!: Date;

    @Column({ type: 'smallint', default: 1 })
    status!: number;
}

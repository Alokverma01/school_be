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
import { Students } from '../students/students.entity';
import { Branches } from '../branches/branches.entity';
import { ExamMaster } from './exam_master.entity';
import { Subject } from '../subjects/subject.entity';
import { Classes } from 'src/classes/classes.entity';
import { Sections } from 'src/sections/sections.entity';

// Unique
@Unique(['exam_id', 'student_id'])
@Entity('exam_result_summary')
export class ExamResultSummary {
    @PrimaryGeneratedColumn()
    result_id: number;

    @ManyToOne(() => Branches)
    @JoinColumn({ name: 'branch_id' })
    branch: Branches;

    @Column({ type: 'int' })
    branch_id: number;

    @ManyToOne(() => ExamMaster, { onDelete: 'CASCADE' }) 
    @JoinColumn({ name: 'exam_id' }) 
    exam: ExamMaster;

    @Column({ type: 'int' })
    exam_id: number;

    @ManyToOne(()=>Classes,{onDelete:'CASCADE'})
    @JoinColumn({name:'class_id'})
    class:Classes;

    @Column({ type: 'int' })
    class_id: number;

    @ManyToOne(()=>Sections,{onDelete:'CASCADE'})
    @JoinColumn({name:'section_id'})
    section:Sections;

    @Column({ type: 'int' })
    section_id: number;

    @ManyToOne(()=>Students,{onDelete:'CASCADE'})
    @JoinColumn({name:'student_id'})
    student:Students;

    @Column({ type: 'int' })
    student_id: number;

    @Column({ type: 'int' })
    total_obtained_marks: number;

    @Column({ type: 'int' })
    total_max_marks: number;

    @Column({ type: 'decimal', precision: 6, scale: 2 })
    percentage: number;

    @Column({ type: 'varchar', length: 10 })
    grade: string;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }) created_at: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }) updated_at: Date;


    @Column({ type: 'smallint', default: 1 }) 
    status: number;
}
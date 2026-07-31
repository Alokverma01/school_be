import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('master_subjects')
export class MasterSubject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    subject_name: string;

    @Column({ type: 'smallint', default: 1 })
    status: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

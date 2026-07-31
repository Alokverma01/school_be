import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Teachers } from '../teachers/teachers.entity';

@Entity('teacher_qualifications')
export class TeacherQualifications {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Teachers, (teacher) => teacher.qualifications, { nullable: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teachers;

  @Column({ name: 'qualification_type', type: 'text' })
  qualification_type: string;

  @Column({ name: 'degree_name', type: 'text' })
  degree_name: string;

  @Column({ name: 'specialization', type: 'text' })
  specialization: string;

  @Column({ name: 'education_level', type: 'text' }) 
  education_level: string; 
  // Allowed: UG, PG, Diploma, PHD etc. (Dropdown UI only, not enum/table)

  @Column({ name: 'institute_name', type: 'text' })
  institute_name: string;

  @Column({ name: 'institute_type', type: 'text' })  
  // Values: Government / Private
  institute_type: string;

  @Column({ name: 'institute_address', type: 'text' })
  institute_address: string;

  @Column({ name: 'teaching_eligibility_exam', type: 'text'})
  teaching_eligibility_exam: string; 
  // Allowed: CTET / STET / TET / NET / SLET / Others

  @Column({ name: 'certificate_number', type: 'text'})
  certificate_number: string;

  @Column({ name: 'passing_year', type: 'text' })
  passing_year: string;
}

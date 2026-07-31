import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Role } from 'src/role/role.entity';
import { UserDetails } from './user_details.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  user_id: number;

  @Column({ name: 'first_name', type: 'text' })
  first_name: string;

  @Column({ name: 'last_name', type: 'text' })
  last_name: string;

  @Column({ name: 'username', type: 'text', unique: true })
  username: string;

  @Column({ name: 'password', type: 'text' })
  password: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', unique: true })
  contact_number: string;

  @Column({name: 'date_of_birth' ,  type: 'date'})
  date_of_birth: Date;

  @Column({ name: 'date_of_joining', type: 'date'})
  date_of_joining: Date;

  // ROLE — dropdown on UI returns role_id
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  // Reporting To — refers to another user (boss/manager)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reporting_to' })
  reporting_to: User;

  @OneToOne(() => UserDetails, details => details.user)
  details: UserDetails;


  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

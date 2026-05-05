import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  name: string;

  @Column()
  managerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'managerId' })
  manager: User;

  @ManyToMany(() => User, (user) => user.teams)
  @JoinTable()
  members: User[];
}

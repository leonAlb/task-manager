import { Task } from './tasks.models';
import { Role } from './auth.models';

export interface TeamSummary {
  id: number;
  name: string;
  memberCount: number;
}

export interface TeamMemberTasks {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  tasks: Task[];
}

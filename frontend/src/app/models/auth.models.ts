import { Task } from './tasks.models';
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export interface User {
  id: number;
  email: string;
  tasks: Task[];
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

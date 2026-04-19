export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface UpdateTask {
  id: number;
  title?: string;
  status?: TaskStatus;
}

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  userId: number;
}

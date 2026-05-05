import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateTask, ReorderTaskItem, Task, UpdateTask } from '../models/tasks.models';
import { User } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/tasks';

  getUsers() {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getTasks() {
    return this.http.get<Task[]>(`${this.apiUrl}`);
  }

  createTask(task: CreateTask) {
    return this.http.post<Task>(this.apiUrl, task);
  }

  delegateTask(task: CreateTask) {
    return this.http.post<Task>(`${this.apiUrl}/delegate`, task);
  }

  updateTask({ id, ...body }: UpdateTask) {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, body);
  }

  reorderTasks(items: ReorderTaskItem[]) {
    return this.http.patch<Task[]>(`${this.apiUrl}/reorder`, { items });
  }

  deleteTask(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

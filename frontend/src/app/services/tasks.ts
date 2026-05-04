import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CreateTask, Task, UpdateTask } from '../models/tasks.models';
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

  createTask(Task: CreateTask) {
    return this.http.post<Task>(`${this.apiUrl}`, Task);
  }

  updateTask({ id, ...body }: UpdateTask) {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, body);
  }

  deleteTask(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

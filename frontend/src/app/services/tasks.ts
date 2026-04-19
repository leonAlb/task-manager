import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Task, UpdateTask } from '../models/tasks.models';
import { User} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class Tasks {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/tasks';

  getUsers() {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getTasks() {
    return this.http.get<Task[]>(`${this.apiUrl}`);
  }

  createTask(title: string) {
    return this.http.post<Task>(`${this.apiUrl}`, { title });
  }

  updateTask(updateTask: UpdateTask) {
    return this.http.patch<Task>(`${this.apiUrl}/${updateTask.id}`, updateTask);
  }

  deleteTask(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/admin';

  seedData() {
    return this.http.post(`${this.apiUrl}/seed`, {});
  }

  deleteAllData() {
    return this.http.delete(`${this.apiUrl}/delete-all`);
  }

  deleteAllTasks() {
    return this.http.delete(`${this.apiUrl}/delete-tasks`);
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.apiUrl}/delete-user/${id}`);
  }
}

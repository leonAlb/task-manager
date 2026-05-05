import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TeamMemberTasks, TeamSummary } from '../models/teams.models';
import { User } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/teams';

  getManagedTeams() {
    return this.http.get<TeamSummary[]>(this.apiUrl);
  }

  createTeam(name: string) {
    return this.http.post<TeamSummary>(this.apiUrl, { name });
  }

  getTeamTasks(teamId: number) {
    return this.http.get<TeamMemberTasks[]>(`${this.apiUrl}/${teamId}/tasks`);
  }

  getAvailableMembers(teamId: number) {
    return this.http.get<User[]>(`${this.apiUrl}/${teamId}/available-users`);
  }

  addMember(teamId: number, userId: number) {
    return this.http.post(`${this.apiUrl}/${teamId}/members`, { userId });
  }
}
